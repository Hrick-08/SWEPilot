import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-dvh overflow-hidden bg-bg-primary">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar />
        <main id="main-content" className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-7 sm:py-9 xl:px-10 xl:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
