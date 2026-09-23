import { Bell, ChevronRight, Menu, LogOut } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MobileSidebar from './MobileSidebar';
import { useAuth } from '../../context/AuthContext';

const pageNames: Record<string, string> = {
  overview: 'Overview',
  issues: 'Issues',
  'pull-requests': 'Pull requests',
  settings: 'Settings',
};

export default function TopBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const pageName = pageNames[location.pathname.split('/')[1]] ?? 'Workspace';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-bg-primary px-4 sm:px-7 xl:px-10">
        <div className="flex min-w-0 items-center gap-3 text-xs">
          <button onClick={() => setMobileMenuOpen(true)} className="icon-button lg:hidden" aria-label="Open menu">
            <Menu className="size-[18px]" />
          </button>
          <span className="hidden text-text-muted sm:inline">Workspace</span>
          <ChevronRight className="hidden size-3 text-text-muted/60 sm:block" aria-hidden="true" />
          <span className="truncate font-medium text-text-secondary">{pageName}</span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* <button className="icon-button" aria-label="Notifications">
            <Bell className="size-4" strokeWidth={1.7} />
          </button> */}
          {/* <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" /> */}
          <div className="flex items-center gap-2.5">
            <span className="hidden max-w-40 truncate text-xs text-text-secondary md:block">{username}</span>
            <div className="flex size-7 items-center justify-center rounded-full border border-border bg-bg-hover text-[11px] font-medium text-text-secondary">
              {username?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <button onClick={handleLogout} className="icon-button hover:text-error" title="Logout" aria-label="Logout">
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </header>
      <MobileSidebar isOpen={mobileMenuOpen} onClose={closeMobileMenu} />
    </>
  );
}
