import type { LucideIcon } from 'lucide-react';
import Card from '../ui/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconColor?: string;
}

export default function StatCard({ title, value, subtitle, icon: Icon, iconColor = '#3B82F6' }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-[#64748B] uppercase tracking-wider">
            {title}
          </p>
          <p className="text-[28px] font-semibold text-[#F8FAFC] mt-1 leading-tight">
            {value}
          </p>
          <p className="text-[12px] text-[#94A3B8] mt-1">
            {subtitle}
          </p>
        </div>
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
      </div>
    </Card>
  );
}
