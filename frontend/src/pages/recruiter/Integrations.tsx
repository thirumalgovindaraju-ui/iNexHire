// src/pages/recruiter/Integrations.tsx — LinkedIn wired to real backend (SIMULATION ONLY); other cards still mock
import { useState, useEffect } from 'react';
import { Zap, CheckCircle, AlertTriangle, Linkedin, Send, Rss, UserPlus, Sparkles, ClipboardPaste } from 'lucide-react';
import { Button, Spinner } from '../../components/ui';
import { linkedinApi, openingsApi } from '../../services/api';

const OTHER_INTEGRATIONS = [
  { name: 'Greenhouse', category: 'ATS', logo: '🌿' },
  { name: 'Workday', category: 'HRIS', logo: '⚙️' },
  { name: 'BambooHR', category: 'HRIS', logo: '🎋' },
  { name: 'Lever', category: 'ATS', logo: '⚡' },
  { name: 'Slack', category: 'Communication', logo: '💬' },
  { name: 'Indeed', category: 'Job Boards', logo: '🔍' },
  { name: 'Naukri.com', category: 'Job Boards', logo: '💼' },
  { name: 'Darwinbox', category: 'HRIS', logo: '📦' },
];

interface OpeningOption { id: string; title: string; }

interface ExtractedProfile {
  name: string | null;
  headline: string | null;
  location: string | null;
  skills: string[];
}

interface SimulatedApplicant {
  name: string;
  headline: string;
  currentRole: string;
  experienceYears: number;
  location: string;
  skills: string[];
  profileUrl: string;
}

const LINKEDIN_DISCLAIMER = 'Simulation mode — this app has no LinkedIn partner/OAuth approval. No real LinkedIn account, job post, or applicant is ever contacted or created.';

export default function Integrations() {
  const [connected, setConnected] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [showConsent, setShowConsent] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openings, setOpenings] = useState<OpeningOption[]>([]);

  // Invite-by-URL form
  const [inviteOpeningId, setInviteOpeningId] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<any>(null);
  const [pastedText, setPastedText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedProfile | null>(null);

  // Job post + applicants
  const [postOpeningId, setPostOpeningId] = useState('');
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState<any>(null);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [applicants, setApplicants] = useState<SimulatedApplicant[] | null>(null);
  const [importingUrl, setImportingUrl] = useState<string | null>(null);
  const [importedUrls, setImportedUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    linkedinApi.status()
      .then((data) => setConnected(data.integration?.status === 'CONNECTED'))
      .catch(() => {})
      .finally(() => setStatusLoading(false));
    openingsApi.list({ limit: 100 })
      .then((data) => {
        const opts = (data.openings ?? []).map((o: any) => ({ id: o.id, title: o.title }));
        setOpenings(opts);
        if (opts.length > 0) {
          setInviteOpeningId(opts[0].id);
          setPostOpeningId(opts[0].id);
        }
      })
      .catch(() => {});
  }, []);

  async function startConnect() {
    try {
      setError(null);
      await linkedinApi.auth();
      setShowConsent(true);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to initiate LinkedIn connection');
    }
  }

  async function authorizeConnect() {
    try {
      setConnecting(true);
      setError(null);
      await linkedinApi.callback();
      setConnected(true);
      setShowConsent(false);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to complete LinkedIn connection');
    } finally {
      setConnecting(false);
    }
  }

  async function extractProfile() {
    if (!profileUrl || !pastedText) return;
    try {
      setExtracting(true);
      setError(null);
      const data = await linkedinApi.parseProfile({ profileUrl: profileUrl.trim(), pastedText });
      setExtracted(data.extracted);
      if (data.extracted?.name) setInviteName(data.extracted.name);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to extract profile info');
    } finally {
      setExtracting(false);
    }
  }

  async function sendInvite() {
    if (!inviteOpeningId || !profileUrl || !inviteEmail) return;
    try {
      setInviting(true);
      setError(null);
      setInviteResult(null);
      const data = await linkedinApi.invite({
        openingId: inviteOpeningId,
        profileUrl: profileUrl.trim(),
        email: inviteEmail.trim(),
        name: inviteName.trim() || undefined,
      });
      setInviteResult(data);
      setProfileUrl('');
      setInviteEmail('');
      setInviteName('');
      setPastedText('');
      setExtracted(null);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  }

  async function postJob() {
    if (!postOpeningId) return;
    try {
      setPosting(true);
      setError(null);
      const data = await linkedinApi.jobPost(postOpeningId);
      setPostResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to post job');
    } finally {
      setPosting(false);
    }
  }

  async function loadApplicants() {
    if (!postOpeningId) return;
    try {
      setLoadingApplicants(true);
      setError(null);
      setApplicants(null);
      const data = await linkedinApi.applicants(postOpeningId);
      setApplicants(data.applicants ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to load applicants');
    } finally {
      setLoadingApplicants(false);
    }
  }

  async function importApplicant(a: SimulatedApplicant) {
    try {
      setImportingUrl(a.profileUrl);
      setError(null);
      await linkedinApi.importApplicant({
        openingId: postOpeningId,
        applicant: { name: a.name, profileUrl: a.profileUrl },
      });
      setImportedUrls((prev) => new Set(prev).add(a.profileUrl));
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to import applicant');
    } finally {
      setImportingUrl(null);
    }
  }

  if (statusLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Integrations</h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Connect your HR tech stack for seamless data flow</p>
      </div>

      {error && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '10px 14px', color: '#f43f5e', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* LinkedIn — real, simulated integration */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 24 }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#e8f4fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Linkedin size={22} style={{ color: '#0077b5' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>LinkedIn</div>
            <div style={{ fontSize: 11.5, color: '#94a3b8' }}>Invite profiles, post jobs, and import applicants</div>
          </div>
          {connected ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#10b981', fontWeight: 500 }}>
              <CheckCircle size={13} /> Connected (simulated)
            </span>
          ) : (
            <Button icon={<Zap size={14} />} onClick={startConnect}>Connect with LinkedIn</Button>
          )}
        </div>

        {/* Disclaimer — always visible on this card */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fff1f2', borderBottom: '1px solid #fecdd3', padding: '10px 18px' }}>
          <AlertTriangle size={14} style={{ color: '#f43f5e', flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 11.5, color: '#9f1239', fontWeight: 500, lineHeight: 1.5 }}>{LINKEDIN_DISCLAIMER}</span>
        </div>

        {/* Simulated consent step */}
        {showConsent && (
          <div style={{ padding: '18px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Simulated LinkedIn Consent Screen</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, lineHeight: 1.6 }}>
              This app is requesting (simulated) access to: your profile info, job posting, and application data.
              No real LinkedIn login page is shown and no real LinkedIn account is contacted — clicking "Authorize"
              simply marks this integration as connected in NexHire for demo purposes.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button icon={<CheckCircle size={13} />} onClick={authorizeConnect} loading={connecting}>Authorize (Simulated)</Button>
              <Button variant="secondary" onClick={() => setShowConsent(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {connected && (
          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 1. Invite via profile URL */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Send size={14} style={{ color: '#4f46e5' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Invite via LinkedIn Profile URL</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <select value={inviteOpeningId} onChange={(e) => setInviteOpeningId(e.target.value)} style={selectStyle}>
                  {openings.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
                </select>
                <input value={profileUrl} onChange={(e) => setProfileUrl(e.target.value)} placeholder="https://www.linkedin.com/in/jane-doe" style={inputStyle} />
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, lineHeight: 1.5 }}>
                  Optional: paste text you copied yourself from the candidate's public profile page (headline,
                  about, skills) — we never fetch LinkedIn ourselves. Claude extracts only what's in the text
                  you paste; nothing is invented.
                </div>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste profile text here..."
                  rows={3}
                  style={{ ...inputStyle, width: '100%', resize: 'vertical', fontFamily: 'inherit', marginBottom: 6 }}
                />
                <Button size="sm" variant="secondary" icon={<ClipboardPaste size={12} />} onClick={extractProfile} loading={extracting} disabled={!profileUrl || !pastedText}>
                  Extract Info
                </Button>
                {extracted && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 12, color: '#334155' }}>
                      <strong>Name:</strong> {extracted.name ?? '— not found in pasted text —'}
                    </div>
                    <div style={{ fontSize: 12, color: '#334155' }}>
                      <strong>Headline:</strong> {extracted.headline ?? '— not found —'}
                    </div>
                    <div style={{ fontSize: 12, color: '#334155' }}>
                      <strong>Location:</strong> {extracted.location ?? '— not found —'}
                    </div>
                    {extracted.skills.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                        {extracted.skills.map((s) => (
                          <span key={s} style={{ fontSize: 10.5, background: '#eef2ff', color: '#4f46e5', borderRadius: 5, padding: '2px 7px' }}>{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
                <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Candidate email (required — real invite is sent here)" style={inputStyle} />
                <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Name (auto-filled from extraction, or guessed from URL)" style={inputStyle} />
                <Button icon={<Send size={13} />} onClick={sendInvite} loading={inviting} disabled={!profileUrl || !inviteEmail}>
                  Send Invite
                </Button>
              </div>
              {inviteResult && (
                <div style={{ marginTop: 10, background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#065f46' }}>
                  Invite sent to <strong>{inviteResult.candidate.name}</strong> ({inviteResult.candidate.email}). {inviteResult.note}
                </div>
              )}
            </div>

            {/* 2. Post job to LinkedIn */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Rss size={14} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Post Job to LinkedIn (Simulated)</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                <select value={postOpeningId} onChange={(e) => { setPostOpeningId(e.target.value); setPostResult(null); setApplicants(null); }} style={selectStyle}>
                  {openings.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
                </select>
                <Button variant="secondary" icon={<Rss size={13} />} onClick={postJob} loading={posting}>Post to LinkedIn (Simulated)</Button>
              </div>
              {postResult && (
                <div style={{ marginTop: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#92400e' }}>
                  {postResult.message} (simulated post ID: {postResult.jobPostId})
                </div>
              )}
            </div>

            {/* 3. Import applicants */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserPlus size={14} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Import Candidates Who "Applied" (Simulated)</span>
                </div>
                <Button variant="secondary" size="sm" icon={<Sparkles size={12} />} onClick={loadApplicants} loading={loadingApplicants}>
                  Load Simulated Applicants
                </Button>
              </div>
              {applicants && applicants.length === 0 && (
                <div style={{ fontSize: 12, color: '#94a3b8' }}>No applicants generated. Try again.</div>
              )}
              {applicants && applicants.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {applicants.map((a) => {
                    const imported = importedUrls.has(a.profileUrl);
                    return (
                      <div key={a.profileUrl} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{a.name}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{a.headline} · {a.location} · {a.experienceYears}y exp</div>
                        </div>
                        <Button
                          size="sm"
                          variant={imported ? 'secondary' : 'primary'}
                          icon={imported ? <CheckCircle size={12} /> : <UserPlus size={12} />}
                          onClick={() => importApplicant(a)}
                          loading={importingUrl === a.profileUrl}
                          disabled={imported}
                        >
                          {imported ? 'Imported' : 'Import'}
                        </Button>
                      </div>
                    );
                  })}
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    Imported candidates get a fabricated placeholder email — edit it on the Candidates page before sending a real invite.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Other integrations — not yet built */}
      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
        Coming Soon
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {OTHER_INTEGRATIONS.map((i) => (
          <div key={i.name} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, opacity: 0.7 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, border: '1px solid #e2e8f0' }}>
              {i.logo}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{i.name}</span>
                <span style={{ fontSize: 10, background: '#f1f5f9', color: '#475569', borderRadius: 4, padding: '1px 6px' }}>{i.category}</span>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Not yet available</div>
            </div>
            <button disabled style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '7px 14px', color: '#94a3b8', fontSize: 12, fontWeight: 500, cursor: 'not-allowed' }}>
              Coming Soon
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, outline: 'none' };
const selectStyle: React.CSSProperties = { ...inputStyle, background: '#fff', cursor: 'pointer' };
