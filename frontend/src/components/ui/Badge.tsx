interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  size?: 'sm' | 'md';
}

const variantStyles: Record<string, string> = {
  default: 'bg-[#1E293B] text-[#94A3B8]',
  success: 'bg-[#22C55E]/10 text-[#22C55E]',
  warning: 'bg-[#F59E0B]/10 text-[#F59E0B]',
  error: 'bg-[#EF4444]/10 text-[#EF4444]',
  info: 'bg-[#3B82F6]/10 text-[#3B82F6]',
  purple: 'bg-[#8B5CF6]/10 text-[#8B5CF6]',
};

export default function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-md ${variantStyles[variant]} ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[12px]'
      }`}
    >
      {children}
    </span>
  );
}
