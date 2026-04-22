// src/pages/landing/LandingPage.tsx
import { useNavigate } from 'react-router-dom';
import { Zap, Shield, BarChart2, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui';

const FEATURES = [
  { icon: <Zap size={22} />, title: 'AI-Generated Questions', desc: 'Paste a job description and get role-specific interview questions in seconds.' },
  { icon: <Clock size={22} />, title: 'Async Interviews', desc: 'Candidates interview on their schedule. No more coordination chaos.' },
  { icon: <BarChart2 size={22} />, title: 'Instant Reports', desc: 'Scored evaluations with strengths, gaps, and hiring recommendations automatically.' },
  { icon: <Shield size={22} />, title: 'Proctoring Built-in', desc: 'Tab switch detection and face monitoring to maintain integrity.' },
];

const STEPS = [
  { n: '01', title: 'Create a job opening', desc: 'Paste your JD or let AI write it. Questions are auto-generated.' },
  { n: '02', title: 'Add candidates', desc: 'Upload a CSV or add manually. Interview links sent via email.' },
  { n: '03', title: 'AI conducts interviews', desc: 'Candidates answer in their own time using their browser.' },
  { n: '04', title: 'Review reports', desc: 'Ranked candidates with scores, transcripts, and recommendations.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-900 text-white">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="font-bold text-sm">N</span>
          </div>
          <span className="font-bold text-lg">NexHire</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-surface-200 hover:text-white" onClick={() => navigate('/login')}>
            Sign in
          </Button>
          <Button onClick={() => navigate('/register')}>Get started free</Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-900/50 border border-brand-700/50 rounded-full px-4 py-1.5 text-sm text-brand-300 mb-8">
          <Zap size={14} /> AI-powered interviews for modern hiring teams
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Screen candidates<br />
          <span className="text-brand-400">10x faster</span> with AI
        </h1>
        <p className="text-xl text-surface-300 max-w-2xl mx-auto mb-10">
          Create a job opening, add candidates, and let AI conduct structured video interviews — then get instant scored reports. No scheduling, no bias.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Button size="lg" icon={<ArrowRight size={18} />} onClick={() => navigate('/register')}>
            Start free — launch in 30 days
          </Button>
          <Button size="lg" variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            onClick={() => navigate('/login')}>
            View demo
          </Button>
        </div>

        <div className="flex items-center justify-center gap-6 mt-10 text-sm text-surface-400">
          {['No credit card required', 'First 50 interviews free', 'Chennai-based team'].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-green-400" /> {t}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need to hire faster</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface-800 rounded-2xl p-6">
              <div className="w-10 h-10 bg-brand-600/20 rounded-xl flex items-center justify-center text-brand-400 mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-surface-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="space-y-6">
          {STEPS.map((s) => (
            <div key={s.n} className="flex items-start gap-6 bg-surface-800 rounded-2xl p-6">
              <span className="text-4xl font-black text-brand-700 font-mono leading-none mt-1">{s.n}</span>
              <div>
                <h3 className="font-semibold text-lg mb-1">{s.title}</h3>
                <p className="text-surface-400 text-sm">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to hire smarter?</h2>
        <p className="text-surface-400 mb-8">Join forward-thinking hiring teams using NexHire to screen faster without sacrificing quality.</p>
        <Button size="lg" icon={<ArrowRight size={18} />} onClick={() => navigate('/register')}>
          Create your free account
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-800 py-8 text-center text-surface-500 text-sm">
        <p>© 2024 NexHire · Built in Chennai 🇮🇳</p>
      </footer>
    </div>
  );
}
