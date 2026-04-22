// src/pages/interview/InterviewComplete.tsx
import { CheckCircle } from 'lucide-react';

export default function InterviewComplete() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={44} className="text-green-400" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">Interview Complete!</h1>
        <p className="text-surface-300 mb-8 leading-relaxed">
          Thank you for completing your interview. Our AI is now evaluating your responses and the hiring team will be in touch soon.
        </p>

        <div className="bg-surface-800 rounded-2xl p-6 text-left space-y-3 mb-8">
          <h3 className="text-white font-semibold mb-3">What happens next?</h3>
          {[
            { step: '1', text: 'AI evaluates your answers (within minutes)' },
            { step: '2', text: 'Recruiter reviews your evaluation report' },
            { step: '3', text: 'You\'ll hear back via email within 2–3 business days' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {step}
              </div>
              <p className="text-surface-300 text-sm">{text}</p>
            </div>
          ))}
        </div>

        <p className="text-surface-400 text-sm">You can now close this tab.</p>
      </div>
    </div>
  );
}
