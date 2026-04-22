// src/layouts/CandidateLayout.tsx
import { Outlet } from 'react-router-dom';

export default function CandidateLayout() {
  return (
    <div className="min-h-screen bg-surface-900 text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface-900/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">N</span>
            </div>
            <span className="text-white font-semibold">NexHire</span>
          </div>
          <span className="text-xs text-surface-200 bg-surface-800 px-3 py-1 rounded-full">
            AI Interview Session
          </span>
        </div>
      </header>
      <main className="pt-14">
        <Outlet />
      </main>
    </div>
  );
}
