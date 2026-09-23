import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export default function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div
      className={`min-w-0 rounded-xl border border-border bg-bg-card shadow-[0_2px_8px_0_#0000000a] ${
        padding ? 'p-5 lg:p-6' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
