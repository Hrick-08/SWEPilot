import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Bot } from 'lucide-react';
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
      <div className="py-16 text-center">
        <p className="text-[16px] text-[#64748B]">Loading issue or no run found.</p>
        <Link to="/issues" className="text-[14px] text-[#3B82F6] hover:underline mt-2 inline-block">
          ← Back to Issues
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/issues"
        className="inline-flex items-center gap-1.5 text-[13px] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Issues
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-start gap-3 flex-wrap">
          <span className="text-[14px] font-mono text-[#64748B]">#{issue.id}</span>
          <h1 className="text-[24px] font-semibold text-[#F8FAFC]">{issue.title}</h1>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant={issue.status === 'open' ? 'success' : 'default'} size="md">
            {issue.status === 'open' ? 'Open' : 'Closed'}
          </Badge>
          {issue.labels.map((label) => (
            <Badge key={label} variant="default" size="md">
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Agent info card */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:justify-self-start">
            <div className="flex items-center gap-1.5 mb-1">
              <Bot className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <p className="text-[11px] text-[#64748B] uppercase tracking-wider">Agent Status</p>
            </div>
            {statusBadge(issue.agentStatus ?? 'pending')}
          </div>
          <div className="sm:justify-self-center">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-[#64748B]" />
              <p className="text-[11px] text-[#64748B] uppercase tracking-wider">Started</p>
            </div>
            <p className="text-[13px] text-[#F8FAFC]">{issue.createdAt.slice(0, 10)}</p>
          </div>
          <div className="sm:justify-self-end">
            <p className="text-[11px] text-[#64748B] uppercase tracking-wider mb-1">Repository</p>
            <p className="text-[13px] font-mono text-[#F8FAFC]">{issue.repository}</p>
          </div>
        </div>
      </Card>

      <LogViewer logs={logs} isStreaming={isStreaming} />
    </div>
  );
}
