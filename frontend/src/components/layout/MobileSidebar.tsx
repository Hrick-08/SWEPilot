import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CircleDot,
  Activity,
  GitPullRequest,
  Settings,
  Bot,
  X,
} from 'lucide-react';
import { useEffect } from 'react';

const navItems = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/issues', label: 'Issues', icon: CircleDot },
  { to: '/runs', label: 'Runs', icon: Activity },
  { to: '/pull-requests', label: 'Pull Requests', icon: GitPullRequest },
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#0B0F17] border-r border-[#1E293B] flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#3B82F6]">
              <Bot className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-[15px] font-semibold text-[#F8FAFC] tracking-tight">
              SWEPilot
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#161D2A] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.to ||
              (item.to !== '/overview' && location.pathname.startsWith(item.to));
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-[#3B82F6]/10 text-white'
                    : 'text-[#94A3B8] hover:bg-[#161D2A] hover:text-[#F8FAFC]'
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] ${
                    isActive ? 'text-[#3B82F6]' : 'text-[#64748B]'
                  }`}
                />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Repository Card */}
        <div className="px-3 pb-4 mt-auto">
          <div className="px-3 py-3 rounded-lg border border-[#1E293B] bg-[#0D121C]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] mb-2">
              Repository
            </p>
            <p className="text-[12.5px] font-mono font-medium text-[#F8FAFC] truncate">
              Hrick-08/SWEPilot
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[11px] text-[#22C55E] font-medium">
                Connected
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
