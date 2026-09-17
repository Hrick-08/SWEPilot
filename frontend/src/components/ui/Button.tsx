import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-[#3B82F6] hover:bg-[#2563EB] text-white border-transparent',
  secondary:
    'bg-[#10151F] hover:bg-[#161D2A] text-[#F8FAFC] border-[#1E293B]',
  ghost:
    'bg-transparent hover:bg-[#161D2A] text-[#94A3B8] hover:text-[#F8FAFC] border-transparent',
  danger:
    'bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border-transparent',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-[12px]',
  md: 'px-4 py-2 text-[13px]',
  lg: 'px-5 py-2.5 text-[14px]',
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
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg border transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
