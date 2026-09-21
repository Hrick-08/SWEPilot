import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CircleDot,
  Activity,
  GitPullRequest,
  Settings,
  Bot,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/issues', label: 'Issues', icon: CircleDot },
  { to: '/runs', label: 'Runs', icon: Activity },
  { to: '/pull-requests', label: 'Pull Requests', icon: GitPullRequest },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const { username } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-[232px] min-w-[232px] h-screen bg-[#0B0F17] border-r border-[#1E293B] sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#1E293B]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#3B82F6]">
          <Bot className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="text-[15px] font-semibold text-[#F8FAFC] tracking-tight">
          SWEPilot
        </span>
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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors duration-150 ${
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
            {username}/SWEPilot
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
  );
}
