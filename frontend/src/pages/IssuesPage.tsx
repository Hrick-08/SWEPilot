import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, CircleDot, Search } from 'lucide-react';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
// import Button from '../components/ui/Button';
import StatusDot from '../components/ui/StatusDot';
import { issuesService } from '../services/issuesService';
import type { Issue } from '../types';

const statusBadge = (status: string) => {
  switch (status) {
    case 'open':
      return <Badge variant="success">Open</Badge>;
    case 'closed':
      return <Badge variant="default">Closed</Badge>;
    case 'in_progress':
      return <Badge variant="info">In Progress</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const labelVariant = (label: string) => {
  switch (label.toLowerCase()) {
    case 'bug':
      return 'error' as const;
    case 'feature':
      return 'purple' as const;
    case 'testing':
      return 'info' as const;
    case 'dependencies':
      return 'warning' as const;
    case 'performance':
      return 'warning' as const;
    case 'security':
      return 'error' as const;
    case 'observability':
      return 'purple' as const;
    default:
      return 'default' as const;
  }
};

export default function IssuesPage() {
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
          <h1 className="page-title">Issues</h1>
          <p className="page-description">A clear view of the work in progress.</p>
        </div>
        <span className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-3 py-2 text-xs text-text-secondary">
          <CircleDot className="size-3.5 text-text-muted" />
          {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
        </span>
      </div>

      <Card padding={false} className="overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:px-5">
          <div className="w-full sm:max-w-xs">
            <Input icon aria-label="Search issues" placeholder="Search by title or issue number…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <p className="text-xs text-text-muted">{filtered.length} {filtered.length === 1 ? 'result' : 'results'}</p>
          {/* <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-bg-secondary border border-border rounded-lg text-[13px] text-text-primary focus:outline-none focus:border-accent-blue"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
            <Button variant="secondary" size="md">
              <Filter className="w-3.5 h-3.5" />
              Filter
            </Button>
          </div> */}
        </div>

        <div className="flex items-center justify-between border-b border-border/70 bg-bg-secondary/40 px-5 py-2.5 sm:px-6">
          <span className="eyebrow">Repository issues</span>
          <span className="eyebrow hidden md:inline">Created</span>
        </div>
        <div className="divide-y divide-border/70">
          {filtered.map((issue) => (
            <Link key={issue.id} to={`/issues/${issue.id}`} className="group flex items-center gap-4 px-5 py-5 transition-colors hover:bg-bg-hover/50 focus-visible:-outline-offset-2 sm:px-6">
              <StatusDot status={issue.status} pulse={issue.agentStatus === 'running'} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-x-2.5 gap-y-1 flex-wrap">
                  <span className="font-mono text-[11px] text-text-muted">#{issue.id}</span>
                  <span className="min-w-0 break-words text-[13px] font-medium leading-relaxed text-text-primary">{issue.title}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {statusBadge(issue.status)}
                  {issue.labels.map((label) => <Badge key={label} variant={labelVariant(label)}>{label}</Badge>)}
                </div>
              </div>
              <span className="hidden shrink-0 text-xs text-text-muted md:block">{issue.createdAt.slice(0, 10)}</span>
              <ChevronRight className="size-4 shrink-0 text-text-muted/60 transition-colors group-hover:text-text-secondary" />
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <span className="mb-4 flex size-11 items-center justify-center rounded-xl border border-border bg-bg-secondary text-text-muted">
              <Search className="size-5" strokeWidth={1.5} />
            </span>
            <p className="text-sm font-medium text-text-secondary">No issues found</p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-text-muted">No issues found matching your criteria.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
