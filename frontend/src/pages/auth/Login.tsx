// src/pages/auth/Login.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { authApi, extractError } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Button, Input } from '../../components/ui';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login(form.email, form.password);
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
      <h2 className="text-2xl font-bold text-surface-900 mb-1">Welcome back</h2>
      <p className="text-sm text-surface-500 mb-8">Sign in to your recruiter account</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          icon={<Mail size={15} />}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          icon={<Lock size={15} />}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-surface-500 mt-6">
        No account?{' '}
        <Link to="/register" className="text-brand-600 font-medium hover:underline">
          Create one
        </Link>
      </p>

      <div className="mt-6 p-3 bg-surface-50 rounded-lg border border-surface-200">
        <p className="text-xs text-surface-500 font-medium mb-1">Demo credentials</p>
        <p className="text-xs text-surface-600">Email: recruiter@acme.com</p>
        <p className="text-xs text-surface-600">Password: password123</p>
      </div>
    </div>
  );
}
