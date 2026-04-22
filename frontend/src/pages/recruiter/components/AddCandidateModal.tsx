// src/pages/recruiter/components/AddCandidateModal.tsx
import { useState } from 'react';
import { candidatesApi, extractError } from '../../../services/api';
import { Modal, Button, Input } from '../../../components/ui';

interface Props {
  open: boolean;
  openingId: string;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddCandidateModal({ open, openingId, onClose, onAdded }: Props) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [sendInvite, setSendInvite] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!form.name || !form.email) return setError('Name and email are required');
    setError('');
    setLoading(true);
    try {
      await candidatesApi.add({ ...form, openingId, sendInvite });
      setForm({ name: '', email: '', phone: '' });
      onAdded();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Candidate"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>Add Candidate</Button>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}
      <div className="space-y-4">
        <Input label="Full Name *" placeholder="Arjun Kumar"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Email *" type="email" placeholder="arjun@email.com"
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Phone" placeholder="+91 99999 00000"
          value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={sendInvite} onChange={(e) => setSendInvite(e.target.checked)}
            className="w-4 h-4 rounded text-brand-600" />
          <div>
            <p className="text-sm font-medium text-surface-900">Send interview invite now</p>
            <p className="text-xs text-surface-500">Candidate receives an email with interview link</p>
          </div>
        </label>
      </div>
    </Modal>
  );
}
