import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, LockKeyhole } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/overview', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.register(username, password, githubToken);
      navigate('/login', {
        replace: true,
        state: { message: 'Account created. Sign in to continue.' },
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Link to="/login" className="mb-8 inline-flex items-center gap-2 text-xs text-text-muted transition-colors hover:text-text-primary">
        <ArrowLeft className="size-3.5" /> Back to sign in
      </Link>
      <div className="mb-8">
        <h1 className="text-[30px] font-semibold tracking-[-0.045em] text-text-primary">Create your account</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-text-muted">Connect your GitHub account. Start building with less busywork.</p>
      </div>

      {error && <div role="alert" className="mb-6 rounded-lg border border-error/20 bg-error/8 px-4 py-3 text-xs leading-relaxed text-error">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="signup-username" className="field-label">Username</label>
          <Input id="signup-username" type="text" value={username} onChange={(event) => setUsername(event.target.value)} required autoComplete="username" placeholder="Choose a username" />
        </div>
        <div>
          <label htmlFor="signup-password" className="field-label">Password</label>
          <Input id="signup-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" placeholder="Create a password" />
        </div>
        <div>
          <label htmlFor="signup-confirm-password" className="field-label">Confirm password</label>
          <Input id="signup-confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} autoComplete="new-password" placeholder="Repeat your password" />
        </div>
        <div className="border-t border-border/70 pt-5">
          <label htmlFor="signup-token" className="field-label">GitHub personal access token</label>
          <Input id="signup-token" type="password" value={githubToken} onChange={(event) => setGithubToken(event.target.value)} required autoComplete="off" aria-describedby="signup-token-help" placeholder="Paste your GitHub token" />
          <p id="signup-token-help" className="mt-2.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-text-muted">
            <LockKeyhole className="mt-0.5 size-3 shrink-0" /> Stored encrypted and used to access your repositories.
          </p>
        </div>
        <Button type="submit" disabled={loading} size="lg" className="mt-3 w-full">
          {loading ? <><Loader2 className="size-4 animate-spin" /> Creating account...</> : <>Create account <ArrowRight className="size-4" /></>}
        </Button>
      </form>
    </AuthLayout>
  );
}
