// src/pages/recruiter/ScheduleLiveInterview.tsx — wired to real backend
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Calendar, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { Button, Spinner } from '../../components/ui';
import { candidatesApi, liveVideoApi } from '../../services/api';

interface CandidateOption {
  id: string;
  name: string;
  email: string;
  openingTitle: string;
  interviewId: string;
}

export default function ScheduleLiveInterview() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ interviewId: string; roomName: string } | null>(null);
  const [copied, setCopied] = useState<'recruiter' | 'candidate' | null>(null);

  useEffect(() => {
    candidatesApi.list({ limit: 100 })
      .then((data: any) => {
        const opts: CandidateOption[] = (data.candidates ?? [])
          .filter((c: any) => c.interviews?.length > 0)
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            openingTitle: c.opening?.title ?? 'Unknown role',
            interviewId: c.interviews[0].id,
          }));
        setCandidates(opts);
        if (opts.length > 0) setSelectedId(opts[0].id);
      })
      .catch((err: any) => setError(err?.response?.data?.error ?? 'Failed to load candidates'))
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setInviteToken(null);
    setResult(null);
    candidatesApi.get(selectedId)
      .then((c: any) => setInviteToken(c.interviews?.[0]?.inviteToken ?? null))
      .catch(() => {});
  }, [selectedId]);

  const selected = candidates.find((c) => c.id === selectedId);

  async function generateLink() {
    if (!selected || !date || !time) return;
    try {
      setCreating(true);
      setError(null);
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      const data = await liveVideoApi.create(selected.interviewId, scheduledAt);
      setResult({ interviewId: selected.interviewId, roomName: data.liveInterview.roomName });
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to schedule the live interview');
    } finally {
      setCreating(false);
    }
  }

  function copyLink(kind: 'recruiter' | 'candidate', link: string) {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  if (loadingList) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <Spinner size={28} />
      </div>
    );
  }

  const recruiterLink = result ? `${window.location.origin}/interviews/${result.interviewId}/live` : null;
  const candidateLink = result && inviteToken ? `${window.location.origin}/interview/${inviteToken}/live` : null;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Schedule Live Interview</h1>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Free video interviews via Jitsi Meet — no account or API key needed</p>
      </div>

      {error && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '10px 14px', color: '#f43f5e', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {candidates.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center' }}>
          <Video size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No eligible candidates</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Only candidates who already have an interview invite can be scheduled here. Invite a candidate from the Candidates page first.</div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px' }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginBottom: 4, display: 'block' }}>Candidate</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 13, background: '#fff', cursor: 'pointer', outline: 'none', marginBottom: 16 }}
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.openingTitle}</option>
            ))}
          </select>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginBottom: 4, display: 'block' }}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginBottom: 4, display: 'block' }}>Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none' }} />
            </div>
          </div>

          <Button icon={<Calendar size={14} />} onClick={generateLink} loading={creating} disabled={!date || !time}>
            {creating ? 'Generating…' : 'Generate Meeting Link'}
          </Button>

          {result && (
            <div style={{ marginTop: 20, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Meeting Links</div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Your link (recruiter — questions panel + notes)</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input readOnly value={recruiterLink ?? ''} style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: '#334155', fontFamily: 'monospace', background: '#f8fafc' }} />
                  <Button size="sm" variant="secondary" icon={copied === 'recruiter' ? <CheckCircle size={12} /> : <Copy size={12} />} onClick={() => recruiterLink && copyLink('recruiter', recruiterLink)}>
                    {copied === 'recruiter' ? 'Copied' : 'Copy'}
                  </Button>
                  <Button size="sm" icon={<ExternalLink size={12} />} onClick={() => navigate(`/interviews/${result.interviewId}/live`)}>
                    Join
                  </Button>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Candidate's link (share this with them)</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input readOnly value={candidateLink ?? 'Loading...'} style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: '#334155', fontFamily: 'monospace', background: '#f8fafc' }} />
                  <Button size="sm" variant="secondary" icon={copied === 'candidate' ? <CheckCircle size={12} /> : <Copy size={12} />} onClick={() => candidateLink && copyLink('candidate', candidateLink)} disabled={!candidateLink}>
                    {copied === 'candidate' ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
