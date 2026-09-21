import { useState } from 'react';
import { FileCode, ChevronDown, ChevronRight, Plus, Minus } from 'lucide-react';
import type { ChangedFile } from '../../types';

interface ChangedFilesProps {
  files: ChangedFile[];
}

export default function ChangedFiles({ files }: ChangedFilesProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <FileCode className="w-4 h-4 text-[#64748B]" />
        {/* <span className="text-[14px] font-medium text-[#F8FAFC]">
          {files.length} files changed
        </span> */}
      </div>

      {files.map((file) => (
        <div
          key={file.path}
          className="border border-[#1E293B] rounded-lg overflow-hidden"
        >
          <button
            onClick={() =>
              setExpanded(expanded === file.path ? null : file.path)
            }
            className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#161D2A] transition-colors text-left"
          >
            {expanded === file.path ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0" />
            )}
            <span className="text-[13px] font-mono text-[#F8FAFC] flex-1 truncate">
              {file.path}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="flex items-center gap-0.5 text-[12px] font-mono text-[#22C55E]">
                <Plus className="w-3 h-3" />
                {file.additions}
              </span>
              <span className="flex items-center gap-0.5 text-[12px] font-mono text-[#EF4444]">
                <Minus className="w-3 h-3" />
                {file.deletions}
              </span>
            </div>
          </button>

          {expanded === file.path && file.diff && (
            <div className="border-t border-[#1E293B] bg-[#0A0E15] p-4 overflow-x-auto">
              <pre className="font-mono text-[12px] leading-relaxed">
                {file.diff.split('\n').map((line, i) => {
                  let cls = 'text-[#94A3B8]';
                  if (line.startsWith('+') && !line.startsWith('+++')) {
                    cls = 'text-[#22C55E] bg-[#22C55E]/5';
                  } else if (line.startsWith('-') && !line.startsWith('---')) {
                    cls = 'text-[#EF4444] bg-[#EF4444]/5';
                  } else if (line.startsWith('@@')) {
                    cls = 'text-[#8B5CF6]';
                  }
                  return (
                    <div key={i} className={`px-2 -mx-2 ${cls}`}>
                      {line}
                    </div>
                  );
                })}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
