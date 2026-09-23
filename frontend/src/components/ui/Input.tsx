import { Search } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: boolean;
}

export default function Input({ icon = false, className = '', ...props }: InputProps) {
  return (
    <div className="relative min-w-0">
      {icon && (
        <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
      )}
      <input
        className={`min-h-11 w-full rounded-lg border border-border bg-bg-secondary text-[13px] text-text-primary placeholder:text-text-muted transition-colors hover:border-text-muted/50 focus:border-accent-blue/60 focus:outline-none focus:ring-3 focus:ring-accent-blue/10 disabled:opacity-50 ${
          icon ? 'py-2.5 pl-10 pr-3.5' : 'px-3.5 py-2.5'
        } ${className}`}
        {...props}
      />
    </div>
  );
}
