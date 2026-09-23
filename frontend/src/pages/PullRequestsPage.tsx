import { useEffect, useState } from 'react';
import { ArrowUpRight, GitMerge, GitPullRequest, CheckCircle2 } from 'lucide-react';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { issuesService } from '../services/issuesService';
import type { Issue } from '../types';

const statusConfig: Record<string, { badge: 'success' | 'purple' | 'default'; icon: typeof GitPullRequest }> = {
  open: { badge: 'success', icon: GitPullRequest },
  merged: { badge: 'purple', icon: GitMerge },
  closed: { badge: 'default', icon: GitPullRequest },
};

export default function PullRequestsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    void issuesService.getAll().then(setIssues).catch(() => setIssues([]));
  }, []);

  const filtered = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(search.toLowerCase()) ||
      `#${issue.id}`.includes(search);
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pull requests</h1>
          <p className="page-description">Agent-generated changes. Ready for your review.</p>
        </div>
      </div>

      <Card padding={false} className="overflow-hidden">
        <div className="flex flex-col justify-between gap-4 border-b border-border p-4 sm:p-5 xl:flex-row xl:items-center">
          <div className="w-full sm:max-w-xs">
            <Input icon aria-label="Search pull requests" placeholder="Search pull requests…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex w-fit max-w-full flex-wrap gap-1 rounded-lg border border-border bg-bg-primary p-1" role="group" aria-label="Filter by status">
            {['all', 'open', 'merged', 'closed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                aria-pressed={statusFilter === status}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === status ? 'bg-bg-hover text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border/70">
          {filtered.map((issue) => {
            const config = statusConfig[issue.status] ?? statusConfig.open!;
            const StatusIcon = config.icon;

            return (
              <a key={issue.id} href={issue.pullRequestUrl ?? `https://github.com/${issue.repository}/pull/${issue.id}`} target="_blank" rel="noreferrer" className="group flex items-start gap-3 px-5 py-5 transition-colors hover:bg-bg-hover/50 focus-visible:-outline-offset-2 sm:gap-4 sm:px-6">
                <StatusIcon className={`mt-0.5 size-[18px] shrink-0 ${issue.status === 'open' ? 'text-success' : issue.status === 'closed' ? 'text-accent-purple' : 'text-text-muted'}`} strokeWidth={1.7} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
                    <span className="font-mono text-[11px] text-text-muted">Issue #{issue.id}</span>
                    <span className="min-w-0 break-words text-[13px] font-medium text-text-primary">{issue.title}</span>
                    <Badge variant={config.badge} size="sm">{issue.status.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-relaxed text-text-muted">
                    <span className="break-all">{issue.repository}</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3 text-success" />{issue.agentStatus ?? 'pending'}</span>
                    <span className="hidden sm:inline">{issue.createdAt}</span>
                  </div>
                </div>
                <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-text-muted/60 transition-colors group-hover:text-accent-blue" />
              </a>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <span className="mb-4 flex size-11 items-center justify-center rounded-xl border border-border bg-bg-secondary text-text-muted"><GitPullRequest className="size-5" strokeWidth={1.5} /></span>
            <p className="text-sm font-medium text-text-secondary">No pull requests found</p>
            <p className="mt-2 text-xs leading-relaxed text-text-muted">No pull requests found matching your criteria.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
