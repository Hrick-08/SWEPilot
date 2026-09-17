import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { TestResult } from '../../types';

interface TestResultsProps {
  tests: TestResult[];
}

export default function TestResults({ tests }: TestResultsProps) {
  const passed = tests.filter((t) => t.status === 'passed').length;
  const failed = tests.filter((t) => t.status === 'failed').length;

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
          <span className="text-[14px] font-medium text-[#22C55E]">{passed} passed</span>
        </div>
        {failed > 0 && (
          <div className="flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-[#EF4444]" />
            <span className="text-[14px] font-medium text-[#EF4444]">{failed} failed</span>
          </div>
        )}
      </div>

      {/* Test list */}
      <div className="border border-[#1E293B] rounded-lg overflow-hidden">
        {tests.map((test, index) => (
          <div
            key={test.name}
            className={`flex items-center gap-3 px-4 py-2.5 ${
              index !== tests.length - 1 ? 'border-b border-[#1E293B]' : ''
            }`}
          >
            {test.status === 'passed' ? (
              <CheckCircle2 className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
            ) : test.status === 'failed' ? (
              <XCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-[#64748B] flex-shrink-0" />
            )}

            <span className="text-[13px] text-[#F8FAFC] flex-1">{test.name}</span>

            {test.suite && (
              <span className="hidden sm:inline text-[11px] px-2 py-0.5 rounded bg-[#1E293B] text-[#64748B] font-mono">
                {test.suite}
              </span>
            )}

            <span className="text-[12px] font-mono text-[#64748B] flex-shrink-0 w-16 text-right">
              {test.duration}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
