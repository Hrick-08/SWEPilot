import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Bot, FolderGit2, CircleDot } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import LogViewer from '../components/issues/LogViewer';
import { useIssueLogs } from '../hooks/useIssueLogs';
import { issuesService } from '../services/issuesService';
import type { Issue } from '../types';

const statusBadge = (status: string) => {
  switch (status) {
    case 'running':
      return <Badge variant="info">Running</Badge>;
    case 'completed':
      return <Badge variant="success">Completed</Badge>;
    case 'failed':
      return <Badge variant="error">Failed</Badge>;
    case 'pending':
      return <Badge variant="default">Pending</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export default function IssueDetailPage() {
  const { issueId } = useParams<{ issueId: string }>();
  const id = Number(issueId);
  const [issue, setIssue] = useState<Issue>();

  useEffect(() => {
    if (Number.isNaN(id)) return;
    void issuesService.getById(id).then(setIssue).catch(() => setIssue(undefined));
  }, [id]);
  const { logs, isStreaming } = useIssueLogs(id);

  if (!issue) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <CircleDot className="mb-4 size-6 text-text-muted" strokeWidth={1.5} />
        <p className="text-sm text-text-secondary">Loading issue or no run found.</p>
        <Link to="/issues" className="mt-4 inline-flex items-center gap-2 text-xs text-accent-blue hover:text-text-primary">
          <ArrowLeft className="size-3.5" /> Back to Issues
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link to="/issues" className="inline-flex items-center gap-2 text-xs text-text-muted transition-colors hover:text-text-primary">
        <ArrowLeft className="size-3.5" />
        Back to Issues
      </Link>

      <div>
        <p className="mb-3 font-mono text-xs text-text-muted">ISSUE / {issue.id}</p>
        <h1 className="max-w-4xl break-words text-2xl font-semibold leading-snug tracking-[-0.035em] text-text-primary sm:text-[30px]">{issue.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant={issue.status === 'open' ? 'success' : 'default'} size="md">{issue.status === 'open' ? 'Open' : 'Closed'}</Badge>
          {issue.labels.map((label) => <Badge key={label} variant="default" size="md">{label}</Badge>)}
        </div>
      </div>

      <Card padding={false}>
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="p-5 sm:p-6">
            <div className="mb-3 flex items-center gap-2 text-text-muted">
              <Bot className="size-3.5" /><p className="eyebrow">Agent status</p>
            </div>
            {statusBadge(issue.agentStatus ?? 'pending')}
          </div>
          <div className="p-5 sm:p-6">
            <div className="mb-3 flex items-center gap-2 text-text-muted">
              <Clock className="size-3.5" /><p className="eyebrow">Started</p>
            </div>
            <p className="text-[13px] text-text-secondary">{issue.createdAt.slice(0, 10)}</p>
          </div>
          <div className="min-w-0 p-5 sm:p-6">
            <div className="mb-3 flex items-center gap-2 text-text-muted">
              <FolderGit2 className="size-3.5" /><p className="eyebrow">Repository</p>
            </div>
            <p className="break-all font-mono text-xs leading-relaxed text-text-secondary">{issue.repository}</p>
          </div>
        </div>
      </Card>

      <LogViewer logs={logs} isStreaming={isStreaming} />
    </div>
  );
}
