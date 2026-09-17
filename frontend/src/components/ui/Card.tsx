import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export default function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div
      className={`bg-[#10151F] border border-[#1E293B] rounded-lg ${
        padding ? 'p-4 lg:p-5' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
