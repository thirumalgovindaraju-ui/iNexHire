// src/components/InstallPWA.tsx
import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const DISMISS_KEY = 'nexhire-pwa-install-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  if (!deferredPrompt || dismissed) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 200,
      maxWidth: 420, margin: '0 auto',
      background: '#0f172a', color: '#fff', borderRadius: 14,
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FF8C00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>N</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Install NexHire App</p>
        <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '2px 0 0' }}>Add to your home screen for quick access</p>
      </div>
      <button
        onClick={handleInstall}
        style={{
          background: '#FF8C00', color: '#fff', border: 'none', borderRadius: 8,
          padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        }}
      >
        <Download size={13} /> Install
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, flexShrink: 0 }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
