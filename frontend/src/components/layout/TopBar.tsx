import { Bell, Menu, LogOut } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileSidebar from './MobileSidebar';
import { useAuth } from '../../context/AuthContext';

export default function TopBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 lg:px-6 bg-[#080B12]/80 backdrop-blur-sm border-b border-[#1E293B]">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-1.5 rounded-md text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#161D2A] transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            className="relative p-2 rounded-md text-[#64748B] hover:text-[#94A3B8] hover:bg-[#161D2A] transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#3B82F6]" />
          </button>

          {/* User */}
          <div className="flex items-center gap-2 ml-2">
            <span className="hidden md:block text-[13px] text-[#94A3B8]">{username}</span>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#3B82F6]/20 text-[#3B82F6] text-[13px] font-semibold">
              {username?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-[#64748B] hover:text-[#EF4444] hover:bg-[#161D2A] rounded-md transition-colors ml-1"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={closeMobileMenu}
      />
    </>
  );
}
