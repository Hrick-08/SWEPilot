import { Github, ExternalLink } from 'lucide-react';
import Card from '../ui/Card';
import { repository } from '../../data/repository';

export default function RepositorySummary() {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#F8FAFC]/5 flex-shrink-0">
          <Github className="w-5 h-5 text-[#F8FAFC]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-mono font-semibold text-[#F8FAFC]">
              {repository.fullName}
            </h3>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[11px] text-[#22C55E] font-medium">Connected</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-[11px] text-[#64748B] uppercase tracking-wider">Open Issues</p>
              <p className="text-[16px] font-semibold text-[#F8FAFC] mt-0.5">{repository.openIssues}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#64748B] uppercase tracking-wider">Open PRs</p>
              <p className="text-[16px] font-semibold text-[#F8FAFC] mt-0.5">{repository.openPRs}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#64748B] uppercase tracking-wider">Merged PRs</p>
              <p className="text-[16px] font-semibold text-[#F8FAFC] mt-0.5">{repository.mergedPRs}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#64748B] uppercase tracking-wider">Default Branch</p>
              <p className="text-[16px] font-mono font-semibold text-[#F8FAFC] mt-0.5">{repository.defaultBranch}</p>
            </div>
          </div>

          <a
            href={repository.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-4 text-[12px] font-medium text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
          >
            View on GitHub
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </Card>
  );
}
