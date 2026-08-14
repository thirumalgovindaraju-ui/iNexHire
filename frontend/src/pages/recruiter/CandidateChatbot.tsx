// src/pages/recruiter/CandidateChatbot.tsx — wired to real backend
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Globe } from 'lucide-react';
import { Spinner } from '../../components/ui';
import { apiClient, openingsApi } from '../../services/api';

interface Message { role: 'bot' | 'user'; text: string; time: string }
interface OpeningOption { id: string; title: string }

const QUICK_REPLIES = ['What is the interview process?', 'When will I hear back?', "What's the salary range?", 'Can I reschedule my interview?'];

function now() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function CandidateChatbot() {
  const [openings, setOpenings] = useState<OpeningOption[]>([]);
  const [openingId, setOpeningId] = useState<string>('');
  const [loadingOpenings, setLoadingOpenings] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    openingsApi.list({ limit: 50 })
      .then((data) => {
        const opts: OpeningOption[] = (data.openings ?? []).map((o: any) => ({ id: o.id, title: o.title }));
        setOpenings(opts);
        if (opts.length > 0) setOpeningId(opts[0].id);
      })
      .catch(() => setError('Failed to load openings'))
      .finally(() => setLoadingOpenings(false));
  }, []);

  useEffect(() => {
    setMessages([{ role: 'bot', text: "Hi! 👋 I'm your AI hiring assistant. Ask me anything about this role — the interview process, timeline, or what to expect.", time: now() }]);
  }, [openingId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  async function send(text?: string) {
    const msg = text ?? input.trim();
    if (!msg || !openingId) return;

    const history = messages.map((m) => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }));
    setMessages((prev) => [...prev, { role: 'user', text: msg, time: now() }]);
    setInput('');
    setTyping(true);
    setError(null);

    try {
      const { data } = await apiClient.post('/chatbot/message', {
        openingId,
        messages: history,
        userMessage: msg,
      });
      setMessages((prev) => [...prev, { role: 'bot', text: data.reply, time: now() }]);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Chatbot failed to respond');
    } finally {
      setTyping(false);
    }
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>AI Candidate Chatbot</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Live preview — powered by Claude, grounded in the selected job's description</p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Globe size={14} style={{ color: '#4f46e5', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: '#64748b', flexShrink: 0 }}>Previewing for:</span>
        {loadingOpenings ? (
          <Spinner size={14} />
        ) : openings.length === 0 ? (
          <span style={{ fontSize: 12, color: '#94a3b8' }}>No openings found — create one first.</span>
        ) : (
          <select
            value={openingId}
            onChange={(e) => setOpeningId(e.target.value)}
            style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', fontSize: 12.5, color: '#0f172a', background: '#fff', cursor: 'pointer', outline: 'none' }}
          >
            {openings.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
          </select>
        )}
      </div>

      {error && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '10px 14px', color: '#f43f5e', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: 540 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={18} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>AI Hiring Assistant</div>
            <div style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%', display: 'inline-block' }} /> Online
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '3px 8px' }}>Live Preview</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.role === 'bot' ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {m.role === 'bot' ? <Bot size={13} style={{ color: '#fff' }} /> : <User size={13} style={{ color: '#64748b' }} />}
              </div>
              <div style={{ maxWidth: '72%' }}>
                <div style={{
                  background: m.role === 'bot' ? '#f8fafc' : '#4f46e5',
                  color: m.role === 'bot' ? '#1e293b' : '#fff',
                  borderRadius: m.role === 'bot' ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                  padding: '10px 14px', fontSize: 13, lineHeight: 1.6,
                  border: m.role === 'bot' ? '1px solid #e2e8f0' : 'none',
                  whiteSpace: 'pre-line',
                }}>{m.text}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, textAlign: m.role === 'user' ? 'right' : 'left', paddingLeft: m.role === 'bot' ? 4 : 0 }}>{m.time}</div>
              </div>
            </div>
          ))}
          {typing && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={13} style={{ color: '#fff' }} />
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px 12px 12px 2px', padding: '10px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 1, 2].map((j) => (
                  <div key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', animation: `bounce 1s ${j * 0.15}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length < 3 && (
          <div style={{ padding: '0 18px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {QUICK_REPLIES.map((r) => (
              <button key={r} onClick={() => send(r)} disabled={!openingId} style={{ fontSize: 11.5, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#4f46e5', borderRadius: 20, padding: '5px 12px', cursor: 'pointer', fontWeight: 500 }}>{r}</button>
            ))}
          </div>
        )}

        <div style={{ padding: '12px 18px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={openingId ? 'Type a message...' : 'Select an opening first'}
            disabled={!openingId}
            style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 10, padding: '9px 14px', fontSize: 13, color: '#0f172a', outline: 'none', background: '#f8fafc' }}
          />
          <button onClick={() => send()} disabled={!openingId || typing} style={{ background: '#4f46e5', border: 'none', borderRadius: 10, padding: '0 16px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', opacity: !openingId || typing ? 0.5 : 1 }}>
            <Send size={15} />
          </button>
        </div>
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
    </div>
  );
}
