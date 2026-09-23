import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, CircleDot, Settings, X } from 'lucide-react';
import { useEffect } from 'react';
import Brand from './Brand';

const navItems = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/issues', label: 'Issues', icon: CircleDot },
  // { to: '/pull-requests', label: 'Pull Requests', icon: GitPullRequest },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const location = useLocation();

  // Close on route change
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside aria-label="Mobile navigation" className="animate-slide-in absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col border-r border-border bg-bg-sidebar">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/70 px-5">
          <Brand />
          <button onClick={onClose} className="icon-button" aria-label="Close menu">
            <X className="size-[18px]" />
          </button>
        </div>
        <nav aria-label="Main navigation" className="flex-1 px-3 py-7">
          <p className="eyebrow mb-3 px-3">Workspace</p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to ||
                (item.to !== '/overview' && location.pathname.startsWith(item.to));
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-border bg-bg-hover text-text-primary'
                      : 'border-transparent text-text-muted hover:bg-bg-hover hover:text-text-secondary'
                  }`}
                >
                  <Icon className={`size-[18px] ${isActive ? 'text-accent-blue' : 'text-text-muted'}`} strokeWidth={1.7} />
                  {item.label}
                  {isActive && <span className="ml-auto size-1 rounded-full bg-accent-blue" />}
                </NavLink>
              );
            })}
          </div>
        </nav>
        <p className="mx-6 mb-6 border-t border-border pt-5 text-xs text-text-muted">From issue to pull request.</p>
      </aside>
    </div>
  );
}
