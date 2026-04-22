// src/pages/auth/Register.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building2 } from 'lucide-react';
import { authApi, extractError } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Button, Input } from '../../components/ui';

export default function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.register(form);
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-surface-900 mb-1">Get started</h2>
      <p className="text-sm text-surface-500 mb-8">Create your NexHire account</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Full name" placeholder="Priya Sharma" icon={<User size={15} />}
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Company name" placeholder="Acme Corp" icon={<Building2 size={15} />}
          value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} />
        <Input label="Work email" type="email" placeholder="priya@company.com" icon={<Mail size={15} />}
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input label="Password" type="password" placeholder="Min 8 characters" icon={<Lock size={15} />}
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-surface-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
