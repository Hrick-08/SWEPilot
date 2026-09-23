import type { ReactNode } from 'react';
import { CircleDot, GitPullRequest, Terminal } from 'lucide-react';
import Brand from './Brand';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg-primary lg:grid lg:grid-cols-[1fr_1fr]">
      <aside className="relative hidden min-h-dvh flex-col border-r border-border/70 bg-bg-sidebar p-10 lg:flex xl:p-14">
        <Brand />
        <div className="mx-auto my-auto w-full max-w-md py-16">
          <div className="mb-7 flex items-center gap-3">
            <span className="h-px w-7 bg-accent-blue/70" />
            <p className="eyebrow">Your next commit starts here</p>
          </div>
          <h2 className="text-[clamp(2.75rem,4.5vw,4.5rem)] font-medium leading-[1.06] tracking-[-0.06em] text-text-primary">
            Less busywork.<br /><span className="text-text-muted">More building.</span>
          </h2>
          <p className="mt-7 max-w-sm text-sm leading-7 text-text-muted">
            Turn GitHub issues into tested, review-ready pull requests. Let SWEPilot handle the steps in between.
          </p>
          <div className="mt-12 space-y-5 border-t border-border/70 pt-8">
            <div className="flex items-center gap-3 text-xs text-text-secondary"><CircleDot className="size-4 text-text-muted" strokeWidth={1.5} /><span>Start with an issue</span><span className="ml-auto font-mono text-[10px] text-text-muted">01</span></div>
            <div className="flex items-center gap-3 text-xs text-text-secondary"><Terminal className="size-4 text-text-muted" strokeWidth={1.5} /><span>Make changes. Run tests.</span><span className="ml-auto font-mono text-[10px] text-text-muted">02</span></div>
            <div className="flex items-center gap-3 text-xs text-text-secondary"><GitPullRequest className="size-4 text-accent-blue" strokeWidth={1.5} /><span>Review the pull request</span><span className="ml-auto font-mono text-[10px] text-text-muted">03</span></div>
          </div>
        </div>
        <p className="text-[11px] text-text-muted">Automated execution. Human oversight.</p>
      </aside>
      <main className="flex min-h-dvh flex-col px-5 py-8 sm:px-10 lg:px-12">
        <div className="mb-10 lg:hidden"><Brand /></div>
        <div className="mx-auto my-auto w-full max-w-[380px] py-6 sm:py-10">
          {children}
        </div>
        <p className="mt-8 text-center text-[11px] text-text-muted">SWEPilot <span className="mx-2 text-border">/</span> From issue to pull request.</p>
      </main>
    </div>
  );
}
