import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  GitBranch,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ExternalLink,
  GitMerge,
  FileCode,
  GitCommit,
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import ChangedFiles from '../components/issues/ChangedFiles';
import TestResults from '../components/issues/TestResults';
import { pullRequests } from '../data/pullRequests';
import { changedFiles } from '../data/changedFiles';
import { testResults } from '../data/testResults';
import { repository } from '../data/repository';

export default function PullRequestDetailPage() {
  const { prId } = useParams<{ prId: string }>();
  const id = Number(prId);
  const pr = pullRequests.find((p) => p.id === id);

  if (!pr) {
    return (
      <div className="py-16 text-center">
        <p className="text-[16px] text-[#64748B]">Pull request not found.</p>
        <Link to="/pull-requests" className="text-[14px] text-[#3B82F6] hover:underline mt-2 inline-block">
          ← Back to Pull Requests
        </Link>
      </div>
    );
  }

  const files = changedFiles[pr.issueId] ?? [];
  const tests = testResults[pr.issueId] ?? [];

  const tabs = [
    { id: 'files', label: 'Changed Files', count: pr.filesChanged },
    { id: 'tests', label: 'Tests', count: pr.testsPassed + pr.testsFailed },
    { id: 'summary', label: 'Agent Summary' },
  ];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/pull-requests"
        className="inline-flex items-center gap-1.5 text-[13px] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Pull Requests
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-mono text-[#64748B]">PR #{pr.id}</span>
          </div>
          <h1 className="text-[24px] font-semibold text-[#F8FAFC] mt-1">
            {pr.title}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant={pr.status === 'open' ? 'success' : pr.status === 'merged' ? 'purple' : 'default'}
              size="md"
            >
              {pr.status.charAt(0).toUpperCase() + pr.status.slice(1)}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={() => window.open(`${repository.url}/pull/${pr.id}`, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open on GitHub
          </Button>
          {pr.status === 'open' && (
            <>
              <Button variant="secondary" size="md">
                Approve
              </Button>
              <Button variant="primary" size="md">
                <GitMerge className="w-3.5 h-3.5" />
                Merge
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <Card>
        <p className="text-[14px] text-[#94A3B8] leading-relaxed">
          {pr.description}
        </p>
      </Card>

      {/* Branch info */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#64748B]" />
            <span className="text-[13px] font-mono text-[#F8FAFC] px-2 py-1 bg-[#0D121C] rounded border border-[#1E293B]">
              {pr.branch}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-[#64748B] hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-mono text-[#F8FAFC] px-2 py-1 bg-[#0D121C] rounded border border-[#1E293B]">
              {pr.targetBranch}
            </span>
          </div>
        </div>
      </Card>

      {/* Status Checks */}
      <Card>
        <h3 className="text-[14px] font-semibold text-[#F8FAFC] mb-3">
          Status Checks
        </h3>
        <div className="space-y-2">
          {pr.checks.map((check) => (
            <div key={check.name} className="flex items-center gap-2.5">
              {check.status === 'passed' ? (
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
              ) : check.status === 'failed' ? (
                <XCircle className="w-4 h-4 text-[#EF4444]" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-[#64748B] animate-spin border-t-transparent" />
              )}
              <span className="text-[13px] text-[#F8FAFC]">{check.name}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <FileCode className="w-3.5 h-3.5 text-[#64748B]" />
            <p className="text-[11px] text-[#64748B] uppercase tracking-wider">Files Changed</p>
          </div>
          <p className="text-[20px] font-semibold text-[#F8FAFC]">{pr.filesChanged}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <GitCommit className="w-3.5 h-3.5 text-[#64748B]" />
            <p className="text-[11px] text-[#64748B] uppercase tracking-wider">Commits</p>
          </div>
          <p className="text-[20px] font-semibold text-[#F8FAFC]">{pr.commits}</p>
        </Card>
        <Card>
          <p className="text-[11px] text-[#64748B] uppercase tracking-wider mb-1">Additions</p>
          <p className="text-[20px] font-semibold text-[#22C55E]">+{pr.additions}</p>
        </Card>
        <Card>
          <p className="text-[11px] text-[#64748B] uppercase tracking-wider mb-1">Deletions</p>
          <p className="text-[20px] font-semibold text-[#EF4444]">-{pr.deletions}</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} defaultTab="files">
        {(activeTab) => (
          <>
            {activeTab === 'files' && <ChangedFiles files={files} />}
            {activeTab === 'tests' && <TestResults tests={tests} />}
            {activeTab === 'summary' && (
              <Card>
                <h3 className="text-[14px] font-semibold text-[#F8FAFC] mb-3">
                  Agent Summary
                </h3>
                <div className="space-y-3 text-[13px] text-[#94A3B8] leading-relaxed">
                  <p>
                    SWEPilot analyzed issue #{pr.issueId} and identified the root cause.
                    The agent modified {pr.filesChanged} files with {pr.additions} additions
                    and {pr.deletions} deletions.
                  </p>
                  <p>
                    All {pr.testsPassed} tests passed successfully. The changes have been
                    committed to branch <code className="font-mono text-[#F8FAFC] bg-[#0D121C] px-1.5 py-0.5 rounded text-[12px]">{pr.branch}</code> and
                    this pull request was created targeting <code className="font-mono text-[#F8FAFC] bg-[#0D121C] px-1.5 py-0.5 rounded text-[12px]">{pr.targetBranch}</code>.
                  </p>
                </div>
              </Card>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
}
