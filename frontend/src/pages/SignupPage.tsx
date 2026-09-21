import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bot, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

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
    <div className="min-h-screen bg-[#080B12] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-[#10151F] border border-[#1E293B] rounded-xl shadow-2xl p-8">
        <Link
          to="/login"
          className="inline-flex items-center text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to sign in
        </Link>

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#3B82F6] rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-[#3B82F6]/20">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">Create your account</h1>
          <p className="text-[#94A3B8] text-sm mt-2 text-center">
            Connect your GitHub account to run SWEPilot fixes.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#94A3B8] mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              autoComplete="username"
              className="w-full bg-[#080B12] border border-[#1E293B] text-[#F8FAFC] text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors placeholder-[#64748B]"
              placeholder="Choose a username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#94A3B8] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-[#080B12] border border-[#1E293B] text-[#F8FAFC] text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors placeholder-[#64748B]"
              placeholder="Create a password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#94A3B8] mb-1">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-[#080B12] border border-[#1E293B] text-[#F8FAFC] text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors placeholder-[#64748B]"
              placeholder="Repeat your password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#94A3B8] mb-1">GitHub personal access token</label>
            <input
              type="password"
              value={githubToken}
              onChange={(event) => setGithubToken(event.target.value)}
              required
              autoComplete="off"
              className="w-full bg-[#080B12] border border-[#1E293B] text-[#F8FAFC] text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors placeholder-[#64748B]"
              placeholder="Paste your GitHub token"
            />
            <p className="text-xs text-[#64748B] mt-2">
              Stored encrypted and used to access your repositories.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}