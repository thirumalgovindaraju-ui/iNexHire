// src/services/google.service.ts — Google OAuth + Gmail/Calendar access for the AI PA
// Agent. Deliberately requests only read + compose scopes, never gmail.send — every
// drafted email lands in the connected account's own Gmail Drafts folder for a human
// to review and send, so this service is structurally incapable of sending mail.
import { google } from 'googleapis';
import { env } from '../config/env';
import { prisma } from '../config/db';
import { AppError } from '../middleware/errorHandler';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

function createOAuthClient() {
  return new google.auth.OAuth2(env.googleClientId, env.googleClientSecret, env.googleRedirectUri);
}

export function getAuthUrl(state: string): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline', // required to get a refresh_token back
    prompt: 'consent',      // force the consent screen every time, so we always get a refresh_token
    scope: SCOPES,
    state,
  });
}

export async function exchangeCodeForTokens(code: string): Promise<{
  googleEmail: string; accessToken: string; refreshToken: string; scope: string; expiryDate: number;
}> {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new AppError(400, 'Google did not return a refresh token — remove app access at myaccount.google.com/permissions and try connecting again');
  }
  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ auth: client, version: 'v2' });
  const { data } = await oauth2.userinfo.get();
  if (!data.email) throw new AppError(502, 'Could not read the connected Google account email');

  return {
    googleEmail: data.email,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    scope: tokens.scope ?? SCOPES.join(' '),
    expiryDate: tokens.expiry_date ?? Date.now() + 3600_000,
  };
}

/** Loads the stored connection for this user and returns a ready, auto-refreshing
 * OAuth2 client — refreshing (and persisting) the access token first if it's expired. */
async function getAuthorizedClient(userId: string) {
  const account = await prisma.paGoogleAccount.findUnique({ where: { userId } });
  if (!account) throw new AppError(404, 'No Google account connected — connect one first');

  const client = createOAuthClient();
  client.setCredentials({ access_token: account.accessToken, refresh_token: account.refreshToken });

  if (account.tokenExpiresAt.getTime() <= Date.now() + 60_000) {
    const { credentials } = await client.refreshAccessToken();
    if (!credentials.access_token) throw new AppError(502, 'Failed to refresh Google access token');
    client.setCredentials(credentials);
    await prisma.paGoogleAccount.update({
      where: { userId },
      data: {
        accessToken: credentials.access_token,
        tokenExpiresAt: new Date(credentials.expiry_date ?? Date.now() + 3600_000),
      },
    });
  }

  return client;
}

export interface PaEmailSummary { gmailId: string; from: string; subject: string; snippet: string; date: string }

export async function fetchRecentEmails(userId: string, maxResults = 15): Promise<PaEmailSummary[]> {
  const auth = await getAuthorizedClient(userId);
  const gmail = google.gmail({ version: 'v1', auth });

  const list = await gmail.users.messages.list({ userId: 'me', maxResults, q: 'newer_than:2d' });
  const messages = list.data.messages ?? [];

  const results = await Promise.all(messages.map(async (m) => {
    if (!m.id) return null;
    const msg = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'metadata', metadataHeaders: ['From', 'Subject', 'Date'] });
    const headers = msg.data.payload?.headers ?? [];
    const header = (name: string) => headers.find((h) => h.name === name)?.value ?? '';
    return {
      gmailId: m.id,
      from: header('From'),
      subject: header('Subject'),
      snippet: msg.data.snippet ?? '',
      date: header('Date'),
    };
  }));

  return results.filter((r): r is PaEmailSummary => r !== null);
}

export interface PaCalendarEvent { title: string; start: string; end: string }

export async function fetchTodayEvents(userId: string): Promise<PaCalendarEvent[]> {
  const auth = await getAuthorizedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth });

  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);

  const { data } = await calendar.events.list({
    calendarId: 'primary',
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (data.items ?? []).map((e) => ({
    title: e.summary ?? '(untitled)',
    start: e.start?.dateTime ?? e.start?.date ?? '',
    end: e.end?.dateTime ?? e.end?.date ?? '',
  }));
}

/** Creates a REAL draft in the connected account's own Gmail — never sends it. This is
 * the actual send boundary: the token has no gmail.send scope, so this is the furthest
 * this service can ever take an outgoing email. */
export async function createGmailDraft(userId: string, params: { to?: string; subject: string; body: string }): Promise<string> {
  const auth = await getAuthorizedClient(userId);
  const gmail = google.gmail({ version: 'v1', auth });

  const headers = [params.to ? `To: ${params.to}` : null, `Subject: ${params.subject}`, 'Content-Type: text/plain; charset=utf-8'].filter(Boolean);
  const raw = Buffer.from(`${headers.join('\r\n')}\r\n\r\n${params.body}`)
    .toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const { data } = await gmail.users.drafts.create({ userId: 'me', requestBody: { message: { raw } } });
  if (!data.id) throw new AppError(502, 'Gmail did not return a draft id');
  return data.id;
}
