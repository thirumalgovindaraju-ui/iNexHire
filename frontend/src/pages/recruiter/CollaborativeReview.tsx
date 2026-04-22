// src/pages/recruiter/CollaborativeReview.tsx — NEW: Panel Collaboration
import { useState } from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown, Minus, Send, Users } from 'lucide-react';
import { Button, StatusBadge } from '../../components/ui';

const PANELISTS = [
  { name: 'Sarah Reynolds', role: 'Head of Talent', avatar: 'SR', vote: 'hire', comment: 'Strong technical depth, very impressed with system design answer.', time: '2h ago' },
  { name: 'Raj Kumar', role: 'Eng. Manager', avatar: 'RK', vote: 'hire', comment: 'Excellent problem-solving. Exceeded expectations on the algo round.', time: '3h ago' },
  { name: 'Maya Patel', role: 'Senior Engineer', avatar: 'MP', vote: 'neutral', comment: 'Good technically but seemed hesitant on leadership/ownership questions.', time: '4h ago' },
];

const VOTE_COLORS: Record<string, [string, string]> = { hire: ['#ecfdf5', '#10b981'], reject: ['#fff1f2', '#f43f5e'], neutral: ['#fffbeb', '#f59e0b'] };
const VOTE_ICONS: Record<string, React.ReactNode> = { hire: <ThumbsUp size={13} />, reject: <ThumbsDown size={13} />, neutral: <Minus size={13} /> };

export default function CollaborativeReview() {
  const [comment, setComment] = useState('');
  const [myVote, setMyVote] = useState<string | null>(null);
  const [comments, setComments] = useState(PANELISTS);

  function submitComment() {
    if (!comment.trim() || !myVote) return;
    setComments([...comments, { name: 'You', role: 'Recruiter', avatar: 'ME', vote: myVote, comment, time: 'just now' }]);
    setComment('');
  }

  const votes = { hire: comments.filter(c => c.vote === 'hire').length, reject: comments.filter(c => c.vote === 'reject').length, neutral: comments.filter(c => c.vote === 'neutral').length };
  const total = comments.length;
  const consensus = votes.hire > total / 2 ? 'hire' : votes.reject > total / 2 ? 'reject' : 'neutral';

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Panel Review — Arjun Kapoor</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Collaborative hiring panel — votes, comments, and final decision</p>
        </div>
        <Button icon={<Users size={14} />} variant="secondary">Invite Reviewer</Button>
      </div>

      {/* Consensus bar */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Panel Consensus</div>
          <div style={{ background: VOTE_COLORS[consensus][0], color: VOTE_COLORS[consensus][1], fontSize: 12, fontWeight: 600, borderRadius: 9, padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 5 }}>
            {VOTE_ICONS[consensus]} {consensus === 'hire' ? 'Lean Hire' : consensus === 'reject' ? 'Lean Reject' : 'Undecided'}
          </div>
        </div>
        <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
          <div style={{ flex: votes.hire, background: '#10b981', borderRadius: '6px 0 0 6px' }} />
          <div style={{ flex: votes.neutral, background: '#f59e0b' }} />
          <div style={{ flex: votes.reject, background: '#f43f5e', borderRadius: '0 6px 6px 0' }} />
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 12 }}>
          {[['Hire', votes.hire, '#10b981'], ['Neutral', votes.neutral, '#f59e0b'], ['Reject', votes.reject, '#f43f5e']].map(([label, count, color]) => (
            <span key={label as string} style={{ color: color as string, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color as string, display: 'inline-block' }} />
              {label}: {count}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14 }}>
        {/* Comments */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Panel Feedback ({comments.length})</div>
          <div style={{ padding: '14px 18px', maxHeight: 380, overflowY: 'auto' }}>
            {comments.map((c, i) => {
              const [bg, color] = VOTE_COLORS[c.vote];
              return (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{c.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{c.name}</span>
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>{c.role}</span>
                      <span style={{ marginLeft: 'auto', background: bg, color, fontSize: 10, borderRadius: 6, padding: '2px 8px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
                        {VOTE_ICONS[c.vote]} {c.vote}
                      </span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.6, background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>{c.comment}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{c.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Add comment */}
          <div style={{ padding: '14px 18px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {(['hire', 'neutral', 'reject'] as const).map(v => {
                const [bg, color] = VOTE_COLORS[v];
                return (
                  <button key={v} onClick={() => setMyVote(v)}
                    style={{ flex: 1, padding: '7px', border: `1.5px solid ${myVote === v ? color : '#e2e8f0'}`, borderRadius: 8, background: myVote === v ? bg : '#fff', color: myVote === v ? color : '#94a3b8', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    {VOTE_ICONS[v]} {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add your feedback..." rows={2}
                style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, resize: 'none', outline: 'none', color: '#0f172a' }}
              />
              <button onClick={submitComment} style={{ background: '#4f46e5', border: 'none', borderRadius: 8, padding: '0 14px', cursor: 'pointer', color: '#fff' }}><Send size={14} /></button>
            </div>
          </div>
        </div>

        {/* Candidate summary */}
        <div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontSize: 18, fontWeight: 700 }}>A</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Arjun Kapoor</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Sr. Backend Engineer</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981' }}>93</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>AI Score</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#4f46e5' }}>91%</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Culture Fit</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#7c3aed' }}>88%</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Confidence</div>
              </div>
            </div>
            <StatusBadge status="STRONG_HIRE" />
          </div>
          <Button className="w-full" style={{ width: '100%' }}>Make Final Decision</Button>
        </div>
      </div>
    </div>
  );
}
