import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/overview', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      navigate('/overview');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-9">
        <p className="eyebrow mb-4">Welcome back</p>
        <h1 className="text-[30px] font-semibold tracking-[-0.045em] text-text-primary">Sign in to SWEPilot</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-text-muted">Pick up where your last commit left off.</p>
      </div>

      {error && <div role="alert" className="mb-6 rounded-lg border border-error/20 bg-error/8 px-4 py-3 text-xs leading-relaxed text-error">{error}</div>}
      {location.state?.message && <div role="status" className="mb-6 rounded-lg border border-success/20 bg-success/8 px-4 py-3 text-xs leading-relaxed text-success">{location.state.message}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-username" className="field-label">Username</label>
          <Input id="login-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" placeholder="Enter your username" />
        </div>
        <div>
          <label htmlFor="login-password" className="field-label">Password</label>
          <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="Enter your password" />
        </div>
        <Button type="submit" disabled={loading} size="lg" className="mt-2 w-full">
          {loading ? <><Loader2 className="size-4 animate-spin" /> Signing in...</> : <>Sign in <ArrowRight className="size-4" /></>}
        </Button>
      </form>

      <p className="mt-8 border-t border-border/70 pt-6 text-center text-xs text-text-muted">
        New to SWEPilot?{' '}
        <Link to="/signup" className="font-medium text-text-secondary transition-colors hover:text-accent-blue">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
