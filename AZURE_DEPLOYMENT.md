# Deploying NexHire to Azure

Target: subscription `iOPEX-Subscription-New`, resource group `DES-A-POC`,
region South India, reusing existing App Service Plan `asp-des-a-poc`.
Redis/BullMQ is intentionally skipped (see note at the bottom).

I could not run any of this myself — Azure CLI isn't installed in the
environment I'm working in, and I have no credentials for this subscription.
Everything below needs to be run by someone with access, from a machine with
`az` installed and `az login` completed against the right subscription.

**Read the caveats before running anything:**
- **Cost**: "Free tier" Postgres/App Service benefits are typically tied to a
  *brand-new* Azure account's first-12-months credit, not to an existing
  subscription like this one. The Postgres SKU below (`Standard_B1ms`,
  Burstable) is the cheapest real option, roughly $12–15/month — not
  guaranteed $0. Confirm with whoever owns billing on this subscription
  before creating it.
- **Region**: Static Web Apps free tier isn't available in every Azure
  region, and South India may not be one of the supported ones. If
  `--location southindia` is rejected for the `staticwebapp` create command,
  use a supported region instead (e.g. `centralus`, `eastasia`, `westus2`) —
  this only affects where the SWA edge/build service is anchored, not where
  your Postgres/App Service resources live, so it doesn't violate keeping
  everything else in South India.
- **App Service Plan must be Linux**: `asp-des-a-poc` needs to be a Linux
  plan for Web App for Containers to work. If it's a Windows plan, the
  `webapp create` command below will fail and you'll need a different (or
  new) Linux plan.
- **Postgres firewall**: the migration step in the GitHub Actions workflow
  runs from GitHub-hosted runners, which have no fixed IP range. The
  `--public-access 0.0.0.0-255.255.255.255` flag below opens the Postgres
  server to any IP, protected only by password + TLS. That's the pragmatic
  zero-effort option; tighten it later (narrower firewall rules, or run
  migrations from inside Azure) if this becomes more than a demo.

---

## 1. Create Azure Database for PostgreSQL (Flexible Server)

```bash
az postgres flexible-server create \
  --resource-group DES-A-POC \
  --name nexhire-pg \
  --location southindia \
  --admin-user nexhireadmin \
  --admin-password '<choose a strong password>' \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 15 \
  --public-access 0.0.0.0-255.255.255.255

az postgres flexible-server db create \
  --resource-group DES-A-POC \
  --server-name nexhire-pg \
  --database-name nexhire_db
```

Connection string (note `sslmode=require` — Azure Postgres enforces TLS):

```
postgresql://nexhireadmin:<password>@nexhire-pg.postgres.database.azure.com:5432/nexhire_db?sslmode=require
```

## 2. Create the Static Web App (frontend)

```bash
az staticwebapp create \
  --name nexhire-frontend \
  --resource-group DES-A-POC \
  --location southindia \
  --sku Free
```

If South India isn't accepted, substitute a supported region per the caveat
above.

## 3. Create the Web App for Containers (backend), on the existing plan

```bash
az webapp create \
  --resource-group DES-A-POC \
  --plan asp-des-a-poc \
  --name nexhire-backend \
  --deployment-container-image-name ghcr.io/<github-owner>/<repo>-backend:latest
```

If the GitHub Container Registry package is private, give the Web App
credentials to pull it (a GitHub PAT with `read:packages` scope works):

```bash
az webapp config container set \
  --name nexhire-backend \
  --resource-group DES-A-POC \
  --docker-custom-image-name ghcr.io/<github-owner>/<repo>-backend:latest \
  --docker-registry-server-url https://ghcr.io \
  --docker-registry-server-user <github-username> \
  --docker-registry-server-password <PAT with read:packages>
```

(Simpler alternative: make the `ghcr.io` package public in its GitHub
package settings, and skip this step entirely.)

## 4. Configure app settings on the Web App

```bash
az webapp config appsettings set \
  --name nexhire-backend \
  --resource-group DES-A-POC \
  --settings \
    NODE_ENV=production \
    WEBSITES_PORT=4000 \
    DATABASE_URL="postgresql://nexhireadmin:<password>@nexhire-pg.postgres.database.azure.com:5432/nexhire_db?sslmode=require" \
    JWT_SECRET="<64+ random chars>" \
    OPENAI_API_KEY="<your key>" \
    ANTHROPIC_API_KEY="<your key>" \
    APP_URL="https://<your-static-web-app-name>.azurestaticapps.net"
```

`REDIS_URL` is intentionally omitted — `server.ts` now treats Redis as
optional in every environment. On startup it logs
`[Redis] Not reachable — continuing without it` and skips the BullMQ
evaluation worker rather than failing to boot. This means **AI evaluation
of interview responses won't run** in this deployment (no queue to process
it) until a real Redis instance is added later.

## 5. Get credentials for GitHub Actions

Publish profile (paste the full XML into a GitHub secret):

```bash
az webapp deployment list-publishing-profiles \
  --name nexhire-backend \
  --resource-group DES-A-POC \
  --xml
```

Static Web Apps deployment token:

```bash
az staticwebapp secrets list \
  --name nexhire-frontend \
  --resource-group DES-A-POC \
  --query "properties.apiKey" -o tsv
```

## 6. Add these secrets in the GitHub repo (Settings → Secrets and variables → Actions)

| Secret | Value |
|---|---|
| `AZURE_WEBAPP_NAME` | `nexhire-backend` |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | XML from step 5 |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | token from step 5 |
| `DATABASE_URL` | same connection string as step 1 (used by the migration step in CI) |
| `VITE_API_URL` | `https://nexhire-backend.azurewebsites.net/api` |

`GITHUB_TOKEN` is automatic — no need to create it.

## 7. Deploy

Push to `main`, or run the workflow manually from the Actions tab
(`Deploy to Azure` → Run workflow). The `backend` job builds and pushes the
Docker image to GHCR, runs `prisma migrate deploy` against the Azure
Postgres instance, then deploys the image to the Web App. The `frontend`
job builds the Vite app and uploads it to the Static Web App.

## 8. Verify

- `https://nexhire-backend.azurewebsites.net/health` should return
  `{"status":"ok",...}`.
- `https://<your-static-web-app-name>.azurestaticapps.net` should load the
  recruiter login page and be able to reach the backend API.
