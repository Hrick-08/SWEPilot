import { Search } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: boolean;
}

export default function Input({ icon = false, className = '', ...props }: InputProps) {
  return (
    <div className="relative">
      {icon && (
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
      )}
      <input
        className={`w-full bg-[#0D121C] border border-[#1E293B] rounded-lg text-[13px] text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 transition-colors ${
          icon ? 'pl-9 pr-3 py-2' : 'px-3 py-2'
        } ${className}`}
        {...props}
      />
    </div>
  );
}
