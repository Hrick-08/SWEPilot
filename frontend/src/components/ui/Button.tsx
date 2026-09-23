import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantStyles: Record<string, string> = {
  primary: 'bg-primary hover:bg-primary-hover text-white border-white/10 shadow-sm',
  secondary: 'bg-bg-card hover:bg-bg-hover text-text-primary border-border',
  ghost: 'bg-transparent hover:bg-bg-hover text-text-secondary hover:text-text-primary border-transparent',
  danger: 'bg-error/10 hover:bg-error/15 text-error border-error/15',
};

const sizeStyles: Record<string, string> = {
  sm: 'min-h-8 px-3 py-1.5 text-xs',
  md: 'min-h-10 px-4 py-2 text-[13px]',
  lg: 'min-h-11 px-5 py-2.5 text-sm',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
