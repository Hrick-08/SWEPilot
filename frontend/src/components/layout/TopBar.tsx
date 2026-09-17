import { Search, Bell, FolderGit2, Menu, X } from 'lucide-react';
import { useState } from 'react';
import MobileSidebar from './MobileSidebar';

export default function TopBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0D121C] border border-[#1E293B]">
            <FolderGit2 className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="text-[13px] font-mono text-[#94A3B8]">
              Hrick-08/SWEPilot
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0D121C] border border-[#1E293B] text-[#64748B] hover:text-[#94A3B8] hover:border-[#334155] transition-colors"
            aria-label="Search"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[13px]">Search...</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 ml-4 text-[10px] font-mono rounded bg-[#161D2A] text-[#64748B] border border-[#1E293B]">
              ⌘K
            </kbd>
          </button>

          {/* Notifications */}
          <button
            className="relative p-2 rounded-md text-[#64748B] hover:text-[#94A3B8] hover:bg-[#161D2A] transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#3B82F6]" />
          </button>

          {/* Avatar */}
          <button
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#3B82F6]/20 text-[#3B82F6] text-[13px] font-semibold hover:bg-[#3B82F6]/30 transition-colors"
            aria-label="User menu"
          >
            A
          </button>
        </div>
      </header>

      {/* Mobile sidebar */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
