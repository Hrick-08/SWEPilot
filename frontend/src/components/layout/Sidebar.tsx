import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, CircleDot, Settings, ArrowUpRight } from 'lucide-react';
import Brand from './Brand';

const navItems = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/issues', label: 'Issues', icon: CircleDot },
  // { to: '/pull-requests', label: 'Pull Requests', icon: GitPullRequest },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden h-dvh w-[220px] shrink-0 flex-col border-r border-border/70 bg-bg-sidebar lg:flex">
      <div className="flex h-16 shrink-0 items-center px-6">
        <Brand />
      </div>

      <nav aria-label="Main navigation" className="flex-1 px-3 pt-7">
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
                className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'border-border bg-bg-hover text-text-primary'
                    : 'border-transparent text-text-muted hover:bg-bg-hover/60 hover:text-text-secondary'
                }`}
              >
                <Icon className={`size-4 ${isActive ? 'text-accent-blue' : 'text-text-muted'}`} strokeWidth={1.7} />
                {item.label}
                {isActive && <span className="ml-auto size-1 rounded-full bg-accent-blue" />}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="mx-6 mb-6 border-t border-border/70 pt-5">
        <div className="flex items-center justify-between text-text-muted">
          <span className="text-[11px] font-medium">Built for the next commit.</span>
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </div>
        <p className="mt-1.5 text-[10px] text-text-muted">Your issues. One focused workspace.</p>
      </div>
    </aside>
  );
}
