interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  size?: 'sm' | 'md';
}

const variantStyles: Record<string, string> = {
  default: 'border-border bg-bg-hover/60 text-text-secondary',
  success: 'border-success/15 bg-success/8 text-success',
  warning: 'border-warning/15 bg-warning/8 text-warning',
  error: 'border-error/15 bg-error/8 text-error',
  info: 'border-accent-blue/15 bg-accent-blue/8 text-accent-blue',
  purple: 'border-accent-purple/15 bg-accent-purple/8 text-accent-purple',
};

export default function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <span
      className={`inline-flex max-w-full items-center break-words rounded-md border font-medium leading-relaxed ${variantStyles[variant]} ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[12px]'
      }`}
    >
      {children}
    </span>
  );
}
