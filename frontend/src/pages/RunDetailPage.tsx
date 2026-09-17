import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  GitBranch,
  Clock,
  Bot,
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Tabs from '../components/ui/Tabs';
import LogViewer from '../components/issues/LogViewer';
import ChangedFiles from '../components/issues/ChangedFiles';
import TestResults from '../components/issues/TestResults';
import { useIssueLogs } from '../hooks/useIssueLogs';
import { runs } from '../data/runs';
import { changedFiles } from '../data/changedFiles';
import { testResults } from '../data/testResults';
import type { StepStatus } from '../types';

const statusBadge = (status: string) => {
  switch (status) {
    case 'running':
      return <Badge variant="info">Running</Badge>;
    case 'completed':
      return <Badge variant="success">Completed</Badge>;
    case 'failed':
      return <Badge variant="error">Failed</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};

const stepIcon = (status: StepStatus) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />;
    case 'running':
      return <Loader2 className="w-5 h-5 text-[#3B82F6] animate-spin" />;
    case 'failed':
      return <XCircle className="w-5 h-5 text-[#EF4444]" />;
    default:
      return <Circle className="w-5 h-5 text-[#64748B]" />;
  }
};

export default function RunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const id = Number(runId);
  const run = runs.find((r) => r.id === id);
  const { logs, isStreaming } = useIssueLogs(id);
  const files = changedFiles[id] ?? [];
  const tests = testResults[id] ?? [];

  if (!run) {
    return (
      <div className="py-16 text-center">
        <p className="text-[16px] text-[#64748B]">Run not found.</p>
        <Link to="/runs" className="text-[14px] text-[#3B82F6] hover:underline mt-2 inline-block">
          ← Back to Runs
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'logs', label: 'Logs' },
    { id: 'files', label: 'Files Changed' },
    { id: 'tests', label: 'Tests' },
    { id: 'metadata', label: 'Metadata' },
  ];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/runs"
        className="inline-flex items-center gap-1.5 text-[13px] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Runs
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-mono text-[#64748B]">Run #{run.id}</span>
          </div>
          <h1 className="text-[24px] font-semibold text-[#F8FAFC] mt-1">
            {run.issueTitle}
          </h1>
          <div className="mt-2">
            {statusBadge(run.status)}
          </div>
        </div>
      </div>

      {/* Workflow Timeline */}
      <Card>
        <h3 className="text-[14px] font-semibold text-[#F8FAFC] mb-4">
          Workflow
        </h3>
        <div className="space-y-0">
          {run.steps.map((step, index) => (
            <div key={step.name} className="flex items-start gap-3">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                {stepIcon(step.status)}
                {index < run.steps.length - 1 && (
                  <div
                    className={`w-px h-6 mt-1 ${
                      step.status === 'completed' ? 'bg-[#22C55E]/30' : 'bg-[#1E293B]'
                    }`}
                  />
                )}
              </div>

              {/* Step info */}
              <div className="flex items-center gap-3 pb-3 flex-1 min-w-0">
                <span
                  className={`text-[13px] font-medium ${
                    step.status === 'completed'
                      ? 'text-[#F8FAFC]'
                      : step.status === 'running'
                        ? 'text-[#3B82F6]'
                        : step.status === 'failed'
                          ? 'text-[#EF4444]'
                          : 'text-[#64748B]'
                  }`}
                >
                  {step.name}
                </span>
                {step.duration && (
                  <span className="text-[11px] font-mono text-[#64748B]">
                    {step.duration}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <Tabs tabs={tabs} defaultTab="logs">
        {(activeTab) => (
          <>
            {activeTab === 'logs' && (
              <LogViewer logs={logs} isStreaming={isStreaming} />
            )}
            {activeTab === 'files' && <ChangedFiles files={files} />}
            {activeTab === 'tests' && <TestResults tests={tests} />}
            {activeTab === 'metadata' && (
              <Card>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MetadataItem label="Repository" value={run.repository} mono />
                  <MetadataItem label="Branch" value={run.branch ?? '—'} mono />
                  <MetadataItem label="Commit" value="a82f9c1" mono />
                  <MetadataItem label="Started" value={run.startedAt} />
                  <MetadataItem label="Duration" value={run.duration ?? 'In progress'} />
                  <MetadataItem label="Agent" value="SWEPilot v1.0" />
                </div>
              </Card>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
}

function MetadataItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1E293B] last:border-0">
      <div className="flex items-center gap-2">
        {label === 'Branch' && <GitBranch className="w-3.5 h-3.5 text-[#64748B]" />}
        {label === 'Started' && <Clock className="w-3.5 h-3.5 text-[#64748B]" />}
        {label === 'Agent' && <Bot className="w-3.5 h-3.5 text-[#8B5CF6]" />}
        <span className="text-[12px] text-[#64748B] uppercase tracking-wider">{label}</span>
      </div>
      <span className={`text-[13px] text-[#F8FAFC] ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}
