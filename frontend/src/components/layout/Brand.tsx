// import { Bot } from 'lucide-react';
// import Image from 'vite/image';

export default function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-accent-blue/20 bg-accent-blue/8 text-accent-blue">
        {/* <Bot className="size-[18px]" strokeWidth={1.7} aria-hidden="true" /> */}
        <img src="/logo.png" alt="SWEPilot Logo" width={32} height={32} />
      </span>
      <span className="text-[15px] font-semibold tracking-[-0.04em] text-text-primary">SWEPilot<span className="text-accent-blue">.</span></span>
    </div>
  );
}
