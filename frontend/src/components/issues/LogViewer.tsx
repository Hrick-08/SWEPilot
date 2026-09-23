import { useRef, useEffect } from 'react';
import { Terminal } from 'lucide-react';
import type { LogEntry } from '../../types';

interface LogViewerProps {
  logs: LogEntry[];
  isStreaming: boolean;
}

const levelColors: Record<string, string> = {
  INFO: 'text-accent-blue',
  SUCCESS: 'text-success',
  WARNING: 'text-warning',
  ERROR: 'text-error',
  DEBUG: 'text-text-muted',
};

export default function LogViewer({ logs, isStreaming }: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-bg-primary">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-bg-card px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <Terminal className="size-4 text-text-muted" />
          <span className="text-xs font-medium text-text-secondary">Agent logs</span>
          {isStreaming && (
            <span className="ml-1 flex items-center gap-1.5 rounded-md border border-accent-blue/15 bg-accent-blue/8 px-2 py-0.5 text-[10px] font-medium text-accent-blue">
              <span className="size-1 animate-pulse rounded-full bg-accent-blue" /> Live
            </span>
          )}
        </div>
        {/* <div className="flex items-center gap-0.5">
          <button className="icon-button !size-8" aria-label="Search logs"><Search className="size-3.5" /></button>
          <button className="icon-button !size-8" aria-label="Auto-scroll"><ArrowDownToLine className="size-3.5" /></button>
          <span className="mx-1 h-3 w-px bg-border" aria-hidden="true" />
          <button className="icon-button !size-8" aria-label="Clear logs"><Trash2 className="size-3.5" /></button>
        </div> */}
      </div>

      <div ref={containerRef} className="max-h-[480px] min-h-64 overflow-auto p-4 font-mono text-[11px] leading-6 sm:p-5 sm:text-xs" tabIndex={0} role="region" aria-label="Agent log output">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <Terminal className="mb-3 size-6 text-text-muted/60" strokeWidth={1.3} />
            <p className="text-xs text-text-muted">Waiting for logs<span className="text-accent-blue">...</span></p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="-mx-2 grid grid-cols-[auto_1fr] gap-x-3 rounded px-2 py-1 hover:bg-bg-secondary sm:grid-cols-[auto_4.5rem_1fr] sm:gap-x-4 sm:py-0.5">
              <span className="col-span-2 text-[10px] text-text-muted sm:col-span-1 sm:text-[11px]">[{log.timestamp}]</span>
              <span className={`font-medium ${levelColors[log.level] ?? 'text-text-secondary'}`}>{log.level}</span>
              <span className="min-w-0 whitespace-pre-wrap break-words text-text-secondary [overflow-wrap:anywhere]">{log.message}</span>
            </div>
          ))
        )}
        {isStreaming && logs.length > 0 && (
          <div className="mt-4 flex items-center gap-2 text-text-muted">
            <span className="size-1 animate-pulse rounded-full bg-accent-blue" />
            <span className="text-[10px]">Streaming...</span>
          </div>
        )}
      </div>
    </div>
  );
}
