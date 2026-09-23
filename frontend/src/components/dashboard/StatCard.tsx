import type { LucideIcon } from 'lucide-react';
import Card from '../ui/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
}

export default function StatCard({ title, value, subtitle, icon: Icon, iconColor }: StatCardProps) {
  return (
    <Card className="relative !p-4 sm:!p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-text-muted">{title}</p>
        <Icon className="size-3.5 shrink-0 text-text-muted" style={iconColor ? { color: iconColor } : undefined} strokeWidth={1.7} aria-hidden="true" />
      </div>
      <p className="mt-5 text-[32px] font-medium leading-none tracking-[-0.045em] text-text-primary">{value}</p>
      {subtitle && <p className="mt-2 text-xs leading-relaxed text-text-muted">{subtitle}</p>}
    </Card>
  );
}
