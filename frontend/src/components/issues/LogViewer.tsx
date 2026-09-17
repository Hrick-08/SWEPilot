import { useRef, useEffect } from 'react';
import { Terminal, ArrowDownToLine, Search, Trash2 } from 'lucide-react';
import type { LogEntry } from '../../types';

interface LogViewerProps {
  logs: LogEntry[];
  isStreaming: boolean;
}

const levelColors: Record<string, string> = {
  INFO: 'text-[#3B82F6]',
  SUCCESS: 'text-[#22C55E]',
  WARNING: 'text-[#F59E0B]',
  ERROR: 'text-[#EF4444]',
  DEBUG: 'text-[#64748B]',
};

export default function LogViewer({ logs, isStreaming }: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-[#0A0E15] border border-[#1E293B] rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1E293B] bg-[#0D121C]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#64748B]" />
          <span className="text-[12px] font-medium text-[#94A3B8]">
            Agent Logs
          </span>
          {isStreaming && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#3B82F6]/10 text-[#3B82F6] text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-1.5 rounded text-[#64748B] hover:text-[#94A3B8] hover:bg-[#161D2A] transition-colors"
            aria-label="Search logs"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 rounded text-[#64748B] hover:text-[#94A3B8] hover:bg-[#161D2A] transition-colors"
            aria-label="Auto-scroll"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 rounded text-[#64748B] hover:text-[#94A3B8] hover:bg-[#161D2A] transition-colors"
            aria-label="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log content */}
      <div
        ref={containerRef}
        className="p-4 max-h-[420px] overflow-y-auto font-mono text-[12.5px] leading-relaxed"
      >
        {logs.length === 0 ? (
          <div className="text-[#64748B] text-center py-8">
            Waiting for logs...
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-3 py-0.5 hover:bg-[#0D121C] -mx-2 px-2 rounded">
              <span className="text-[#64748B] flex-shrink-0 select-none">
                [{log.timestamp}]
              </span>
              <span
                className={`flex-shrink-0 w-16 font-medium ${
                  levelColors[log.level] ?? 'text-[#94A3B8]'
                }`}
              >
                {log.level}
              </span>
              <span className="text-[#E2E8F0]">{log.message}</span>
            </div>
          ))
        )}
        {isStreaming && logs.length > 0 && (
          <div className="flex items-center gap-2 mt-1 text-[#64748B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
            <span className="text-[11px]">Streaming...</span>
          </div>
        )}
      </div>
    </div>
  );
}
