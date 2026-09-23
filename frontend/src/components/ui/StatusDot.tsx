import type { RunStatus } from '../../types';

interface StatusDotProps {
  status: RunStatus | 'open' | 'closed' | 'merged' | 'in_progress' | 'success' | 'info' | 'warning' | 'error';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

const statusColors: Record<string, string> = {
  running: 'bg-accent-blue',
  completed: 'bg-success',
  success: 'bg-success',
  failed: 'bg-error',
  error: 'bg-error',
  pending: 'bg-text-muted',
  cancelled: 'bg-text-muted',
  open: 'bg-success',
  closed: 'bg-text-muted',
  merged: 'bg-accent-purple',
  in_progress: 'bg-accent-blue',
  info: 'bg-accent-blue',
  warning: 'bg-warning',
};

export default function StatusDot({ status, size = 'sm', pulse }: StatusDotProps) {
  const shouldPulse = pulse ?? (status === 'running' || status === 'in_progress');
  const sizeClass = size === 'sm' ? 'size-1.5' : 'size-2';

  return (
    <span
      role="img"
      aria-label={status.replace(/_/g, ' ')}
      className={`inline-block shrink-0 rounded-full ring-4 ring-current/5 ${sizeClass} ${statusColors[status] ?? 'bg-text-muted'} ${
        shouldPulse ? 'animate-pulse' : ''
      }`}
    />
  );
}
