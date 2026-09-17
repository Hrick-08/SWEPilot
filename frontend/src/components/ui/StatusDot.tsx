import type { RunStatus } from '../../types';

interface StatusDotProps {
  status: RunStatus | 'open' | 'closed' | 'merged' | 'in_progress' | 'success' | 'info' | 'warning' | 'error';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

const statusColors: Record<string, string> = {
  running: 'bg-[#3B82F6]',
  completed: 'bg-[#22C55E]',
  success: 'bg-[#22C55E]',
  failed: 'bg-[#EF4444]',
  error: 'bg-[#EF4444]',
  pending: 'bg-[#64748B]',
  cancelled: 'bg-[#64748B]',
  open: 'bg-[#22C55E]',
  closed: 'bg-[#64748B]',
  merged: 'bg-[#8B5CF6]',
  in_progress: 'bg-[#3B82F6]',
  info: 'bg-[#3B82F6]',
  warning: 'bg-[#F59E0B]',
};

export default function StatusDot({ status, size = 'sm', pulse }: StatusDotProps) {
  const shouldPulse = pulse ?? (status === 'running' || status === 'in_progress');
  const sizeClass = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';

  return (
    <span
      className={`inline-block rounded-full ${sizeClass} ${statusColors[status] ?? 'bg-[#64748B]'} ${
        shouldPulse ? 'animate-pulse' : ''
      }`}
    />
  );
}
