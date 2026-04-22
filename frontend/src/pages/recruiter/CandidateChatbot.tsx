// src/pages/recruiter/CandidateChatbot.tsx — NEW: 24/7 AI Candidate Chatbot
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Zap, Settings, Globe, MessageSquare, Clock } from 'lucide-react';
import { Button } from '../../components/ui';

interface Message { role: 'bot' | 'user'; text: string; time: string }

const INIT_MESSAGES: Message[] = [
  { role: 'bot', text: "Hi! 👋 I'm Aria, your AI hiring assistant from Acme Corp. I can answer questions about the role, help you schedule your interview, or check your application status. How can I help?", time: 'just now' },
];

const QUICK_REPLIES = ['What is the interview process?', 'When will I hear back?', 'What's the salary range?', 'Can I reschedule my interview?'];

const BOT_RESPONSES: Record<string, string> = {
  'What is the interview process?': "Great question! The process has 3 stages:\n1️⃣ AI Video Interview (30 min, at your convenience)\n2️⃣ Technical Assessment (if applicable)\n3️⃣ Final Round with hiring manager\n\nYou'll receive results within 48 hours of each stage. Ready to start?",
  "When will I hear back?": "Our AI evaluates your interview within 2 hours of completion. You'll receive an email update at each stage. The full process typically takes 5–7 business days. ⚡",
  "What's the salary range?": "For this role, the approved compensation band is ₹18–28 LPA depending on experience. We also offer ESOPs, annual bonus, and full health coverage. Would you like to know more about our benefits?",
  "Can I reschedule my interview?": "Absolutely! Your interview link is valid for 7 days. You can start it anytime — it's fully on-demand, no scheduling needed. Just click the link when you're ready. 📅",
};

const STATS = [
  { label: 'Avg Response Time', value: '< 2s', icon: <Clock size={14} />, color: '#10b981' },
  { label: 'Conversations Today', value: '284', icon: <MessageSquare size={14} />, color: '#4f46e5' },
  { label: 'Resolution Rate', value: '94%', icon: <Zap size={14} />, color: '#f59e0b' },
  { label: 'Languages', value: '15+', icon: <Globe size={14} />, color: '#7c3aed' },
];

export default function CandidateChatbot() {
  const [messages, setMessages] = useState<Message[]>(INIT_MESSAGES);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [tab, setTab] = useState<'preview' | 'config'>('preview');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  function send(text?: string) {
    const msg = text ?? input.trim();
    if (!msg) return;
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', text: msg, time: now }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const reply = BOT_RESPONSES[msg] ?? "Thanks for your question! A recruiter will follow up within 24 hours. In the meantime, feel free to start your AI interview at any time using your invite link. 🚀";
      setMessages(prev => [...prev, { role: 'bot', text: reply, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }]);
      setTyping(false);
    }, 1200);
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>AI Candidate Chatbot</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>24/7 conversational AI that answers candidate FAQs, collects info, and schedules interviews — like Paradox Olivia</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" icon={<Settings size={13} />} onClick={() => setTab(tab === 'config' ? 'preview' : 'config')}>Configure</Button>
          <Button icon={<Globe size={13} />}>Embed on Career Page</Button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {STATS.map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* Chat preview */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: 540 }}>
          {/* Chat header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} style={{ color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Aria — Acme Corp Hiring Assistant</div>
              <div style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%', display: 'inline-block' }} /> Online 24/7
              </div>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '3px 8px' }}>Live Preview</div>
          </div>

          {/* Messages */}
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
                  {[0, 1, 2].map(j => (
                    <div key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', animation: `bounce 1s ${j * 0.15}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {messages.length < 3 && (
            <div style={{ padding: '0 18px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {QUICK_REPLIES.map(r => (
                <button key={r} onClick={() => send(r)} style={{ fontSize: 11.5, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#4f46e5', borderRadius: 20, padding: '5px 12px', cursor: 'pointer', fontWeight: 500 }}>{r}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '12px 18px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Type a message..."
              style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 10, padding: '9px 14px', fontSize: 13, color: '#0f172a', outline: 'none', background: '#f8fafc' }}
            />
            <button onClick={() => send()} style={{ background: '#4f46e5', border: 'none', borderRadius: 10, padding: '0 16px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
              <Send size={15} />
            </button>
          </div>
        </div>

        {/* Config panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Bot Configuration</div>
            {[
              { label: 'Bot Name', val: 'Aria' },
              { label: 'Persona', val: 'Friendly & Professional' },
              { label: 'Handoff Email', val: 'talent@acme.com' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginBottom: 4, display: 'block' }}>{f.label}</label>
                <input defaultValue={f.val} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: 12.5, color: '#0f172a', outline: 'none' }} />
              </div>
            ))}
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginBottom: 4, display: 'block' }}>Primary Language</label>
              <select style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: 12.5, color: '#0f172a', background: '#fff', cursor: 'pointer', outline: 'none' }}>
                <option>English</option><option>Hindi</option><option>Tamil</option><option>Spanish</option>
              </select>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>Chatbot Capabilities</div>
            {[
              ['Answer FAQs', true], ['Schedule interviews', true], ['Collect candidate info', true],
              ['Send invite links', true], ['Escalate to human', true], ['Resume collection', false],
            ].map(([label, enabled]) => (
              <div key={label as string} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f8fafc' }}>
                <span style={{ fontSize: 12.5, color: '#334155' }}>{label as string}</span>
                <span style={{ fontSize: 10, fontWeight: 500, background: enabled ? '#ecfdf5' : '#f8fafc', color: enabled ? '#10b981' : '#94a3b8', borderRadius: 9, padding: '2px 8px' }}>{enabled ? '● On' : '○ Off'}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#3730a3', marginBottom: 6 }}>📋 Embed snippet</div>
            <code style={{ fontSize: 10, color: '#4f46e5', background: '#fff', display: 'block', padding: '8px 10px', borderRadius: 7, border: '1px solid #c7d2fe', fontFamily: 'monospace', lineHeight: 1.6 }}>
              {'<script src="https://cdn\n.nexhire.ai/chatbot.js"\ndata-key="YOUR_KEY">\n</script>'}
            </code>
          </div>
        </div>
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
    </div>
  );
}
