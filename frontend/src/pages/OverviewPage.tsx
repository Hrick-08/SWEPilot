import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, CheckCircle2, ChevronRight, CircleDot, Clock3, RefreshCw, Terminal, Wifi, WifiOff, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import StatCard from '../components/dashboard/StatCard';
import { getJson, websocketUrl } from '../services/api';
import { issuesService } from '../services/issuesService';
import { runsService } from '../services/runsService';
import type { Issue, LogEntry, Run, RunStatus } from '../types';

type RequestState = 'loading' | 'ready' | 'error';
type HealthState = 'loading' | 'online' | 'offline';
type LogConnection = 'idle' | 'loading' | 'connected' | 'reconnecting' | 'disconnected';

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' {
  if (status === 'running') return 'info';
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'error';
  if (status === 'pending') return 'warning';
  return 'default';
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return 'Not finished';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function isRunning(status: RunStatus | string) {
  return status === 'running';
}

function LoadingBlock({ className = 'h-20' }: { className?: string }) {
  return <div role="status" aria-label="Loading" className={`animate-pulse rounded-xl border border-border bg-bg-hover/50 ${className}`} />;
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center px-5 py-16 text-center">
      <span className="mb-4 flex size-11 items-center justify-center rounded-xl border border-border bg-bg-secondary text-text-muted">
        <CircleDot className="size-5" strokeWidth={1.5} />
      </span>
      <p className="text-sm font-medium text-text-secondary">{title}</p>
      <p className="mt-2 max-w-xs text-xs leading-relaxed text-text-muted">{message}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4" role="alert">
      <p className="text-[13px] text-error">{message}</p>
      <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary">
        <RefreshCw className="size-3.5" /> Retry
      </button>
    </div>
  );
}

function RunRow({ run, selected, onSelect }: { run: Run; selected: boolean; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-[#1E293B] last:border-b-0 hover:bg-[#161D2A] transition-colors ${selected ? 'bg-[#3B82F6]/10' : ''}`}><Activity className={`w-4 h-4 flex-shrink-0 ${isRunning(run.status) ? 'text-[#3B82F6]' : 'text-[#64748B]'}`} /><div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><span className="text-[13px] font-medium text-[#F8FAFC] truncate">{run.issueTitle || `Issue #${run.issueId}`}</span><Badge variant={statusVariant(run.status)}>{statusLabel(run.status)}</Badge></div><div className="flex items-center gap-3 mt-1 text-[11px] text-[#64748B]"><span className="truncate">{run.repository || 'Repository not provided'}</span><span className="flex items-center gap-1"><Clock3 className="w-3 h-3" />{formatDate(run.startedAt)}</span></div></div><ChevronRight className="w-4 h-4 text-[#64748B] flex-shrink-0" /></button>;
}

function RecentIssues({ issues, state, onRetry }: { issues: Issue[]; state: RequestState; onRetry: () => void }) {
  const recentIssues = issues.slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 5);
  return (
    <Card padding={false} className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-5 sm:px-6">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-text-primary">Recent issues</h2>
          <p className="mt-1 text-xs text-text-muted">The latest work moving through your workspace.</p>
        </div>
        <Link to="/issues" className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-blue transition-colors hover:text-text-primary">
          View all <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
      {state === 'loading' && <div className="space-y-3 p-5"><LoadingBlock /><LoadingBlock /><LoadingBlock /></div>}
      {state === 'error' && <div className="px-5"><ErrorState message="Issues could not be loaded." onRetry={onRetry} /></div>}
      {state === 'ready' && recentIssues.length === 0 && <EmptyState title="No issues yet" message="GitHub issues processed by SWEPilot will appear here." />}
      {state === 'ready' && recentIssues.map((issue) => (
        <Link key={issue.id} to={`/issues/${issue.id}`} className="group flex items-start gap-3 border-b border-border/70 px-5 py-5 transition-colors last:border-b-0 hover:bg-bg-hover/50 focus-visible:-outline-offset-2 sm:gap-4 sm:px-6">
          <CircleDot className="mt-0.5 size-4 shrink-0 text-text-muted" strokeWidth={1.7} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
              <span className="font-mono text-[11px] text-text-muted">#{issue.id}</span>
              <span className="min-w-0 break-words text-[13px] font-medium text-text-primary">{issue.title}</span>
              <Badge variant={statusVariant(issue.status)}>{statusLabel(issue.status)}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-relaxed text-text-muted">
              <span className="break-all">{issue.repository}</span>
              <span aria-hidden="true">·</span>
              <span>{formatDate(issue.updatedAt)}</span>
              <span aria-hidden="true">·</span>
              <span>{statusLabel(issue.agentStatus ?? 'unknown')}</span>
            </div>
            {issue.labels.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{issue.labels.map((label) => <Badge key={label}>{label}</Badge>)}</div>}
          </div>
          <ChevronRight className="mt-0.5 size-4 shrink-0 text-text-muted/60 transition-colors group-hover:text-text-secondary" />
        </Link>
      ))}
    </Card>
  );
}

export default function OverviewPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [runsState, setRunsState] = useState<RequestState>('loading');
  const [issuesState, setIssuesState] = useState<RequestState>('loading');
  const [health, setHealth] = useState<HealthState>('loading');
  const [selectedRun, setSelectedRun] = useState<Run>();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logConnection, setLogConnection] = useState<LogConnection>('idle');

  const loadRuns = () => { setRunsState('loading'); void runsService.getAll().then((value) => { setRuns(value); setRunsState('ready'); }).catch(() => setRunsState('error')); };
  const loadIssues = () => { setIssuesState('loading'); void issuesService.getAll().then((value) => { setIssues(value); setIssuesState('ready'); }).catch(() => setIssuesState('error')); };
  const checkHealth = () => { setHealth('loading'); void getJson<{ status: string }>('/health').then((value) => setHealth(value.status === 'ok' ? 'online' : 'offline')).catch(() => setHealth('offline')); };

  useEffect(() => { loadRuns(); loadIssues(); checkHealth(); }, []);

  useEffect(() => {
    const socket = new WebSocket(websocketUrl('/ws/logs'));
    socket.onmessage = (message) => {
      const event = JSON.parse(message.data) as { type?: string };
      if (event.type === 'run_started' || event.type === 'run_finished') {
        loadRuns();
        loadIssues();
      }
    };
    return () => socket.close();
  }, []);

  useEffect(() => {
    if (!selectedRun) { setLogs([]); setLogConnection('idle'); return; }
    let cancelled = false;
    let socket: WebSocket | undefined;
    let reconnectTimer: number | undefined;
    const runId = String(selectedRun.id);
    setLogs([]);
    setLogConnection('loading');

    const loadLogs = async () => {
      try {
        const existing = await getJson<Array<{ type: string; timestamp?: string; level?: string; message?: string }>>(`/runs/${runId}/logs`);
        if (!cancelled) setLogs(existing.filter((event) => event.type === 'log' && event.message).map((event, index) => ({ id: `${runId}-${event.timestamp ?? index}`, timestamp: event.timestamp ?? '', level: (event.level ?? 'INFO') as LogEntry['level'], message: event.message ?? '' })));
      } catch { if (!cancelled) setLogs([]); }
    };
    const connect = () => {
      if (cancelled || !isRunning(selectedRun.status)) return;
      setLogConnection('loading');
      socket = new WebSocket(websocketUrl(`/ws/logs/${runId}`));
      socket.onopen = () => setLogConnection('connected');
      socket.onmessage = (message) => { const event = JSON.parse(message.data) as { type?: string; timestamp?: string; level?: string; message?: string }; if (event.type === 'log' && event.message) setLogs((current) => [...current, { id: `${runId}-${event.timestamp ?? current.length}`, timestamp: event.timestamp ?? '', level: (event.level ?? 'INFO') as LogEntry['level'], message: event.message ?? '' }]); };
      socket.onclose = () => { if (!cancelled) { setLogConnection('reconnecting'); reconnectTimer = window.setTimeout(connect, 2000); } };
      socket.onerror = () => setLogConnection('disconnected');
    };
    void loadLogs();
    connect();
    return () => { cancelled = true; if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer); socket?.close(); };
  }, [selectedRun]);

  const sortedRuns = runs.slice().sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
  const activeRuns = runs.filter((run) => isRunning(run.status));
  const runningCount = activeRuns.length;
  const completedCount = runs.filter((run) => run.status === 'completed').length;
  const failedCount = runs.filter((run) => run.status === 'failed').length;

  return (
    <div className="space-y-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-description">Your issues, agent activity, and progress. In one place.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-bg-card px-3 py-2 text-[11px] text-text-secondary" role="status">
          <span className={`size-1.5 rounded-full ${health === 'online' ? 'bg-success' : health === 'offline' ? 'bg-error' : 'bg-warning animate-pulse'}`} />
          {health === 'online' ? 'API Online' : health === 'offline' ? 'API Offline' : 'Checking API'}
        </div>
      </div>
      <section aria-label="Workspace statistics">
        <p className="eyebrow mb-3">At a glance</p>
        {runsState === 'loading' || issuesState === 'loading' ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">{[1, 2, 3, 4, 5].map((item) => <LoadingBlock key={item} className="h-[132px]" />)}</div>
        ) : runsState === 'error' || issuesState === 'error' ? (
          <Card><ErrorState message="Overview data could not be loaded." onRetry={() => { loadRuns(); loadIssues(); }} /></Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            <StatCard title="Total issues" value={issues.length} icon={CircleDot} />
            <StatCard title="Total runs" value={runs.length} icon={Activity} />
            <StatCard title="Running" value={runningCount} icon={Terminal} />
            <StatCard title="Completed" value={completedCount} icon={CheckCircle2} />
            <StatCard title="Failed" value={failedCount} icon={XCircle} />
          </div>
        )}
      </section>
  {/* <div className="grid grid-cols-1 xl:grid-cols-5 gap-4"><Card padding={false} className="xl:col-span-3"><div className="px-4 lg:px-5 py-4 border-b border-[#1E293B]"><h2 className="text-[15px] font-semibold text-[#F8FAFC]">Recent Runs</h2><p className="text-[12px] text-[#64748B] mt-1">Your latest agent executions.</p></div>{runsState === 'loading' ? <div className="space-y-2 p-4"><LoadingBlock /><LoadingBlock /><LoadingBlock /></div> : runsState === 'error' ? <div className="px-4"><ErrorState message="Runs could not be loaded." onRetry={loadRuns} /></div> : sortedRuns.length === 0 ? <EmptyState title="No agent runs yet" message="Runs will appear here when SWEPilot processes an issue." /> : sortedRuns.slice(0, 5).map((run) => <RunRow key={run.id} run={run} selected={selectedRun?.id === run.id} onSelect={() => setSelectedRun(run)} />)}</Card><Card className="xl:col-span-2"><div className="flex items-center gap-2"><Terminal className="w-4 h-4 text-[#3B82F6]" /><h2 className="text-[15px] font-semibold text-[#F8FAFC]">Live Agent Execution</h2></div><p className="text-[12px] text-[#64748B] mt-1">{selectedRun ? selectedRun.issueTitle : 'Select a running run to view live agent logs.'}</p><select value={selectedRun && isRunning(selectedRun.status) ? String(selectedRun.id) : ''} onChange={(event) => setSelectedRun(activeRuns.find((run) => String(run.id) === event.target.value))} className="w-full mt-4 bg-[#0D121C] border border-[#1E293B] rounded-lg px-3 py-2 text-[12px] text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"><option value="">{activeRuns.length ? 'Select a running run' : 'No active agent runs'}</option>{activeRuns.map((run) => <option key={run.id} value={run.id}>{run.issueTitle || `Issue #${run.issueId}`}</option>)}</select>{selectedRun && isRunning(selectedRun.status) ? <><div className="flex items-center gap-1.5 mt-3 text-[11px] text-[#94A3B8]">{logConnection === 'connected' ? <Wifi className="w-3.5 h-3.5 text-[#22C55E]" /> : <WifiOff className="w-3.5 h-3.5 text-[#F59E0B]" />}{statusLabel(logConnection)}</div><div className="mt-3 h-56 overflow-y-auto rounded-lg bg-[#080B12] border border-[#1E293B] p-3 font-mono text-[11px] text-[#94A3B8]">{logs.length ? logs.map((log) => <div key={log.id} className="mb-1"><span className="text-[#64748B]">{log.timestamp ? formatDate(log.timestamp) : ''}</span> <span className="text-[#60A5FA]">[{log.level}]</span> {log.message}</div>) : <span className="text-[#64748B]">Waiting for agent logs...</span>}</div></> : <div className="mt-4 rounded-lg border border-dashed border-[#1E293B] py-10 text-center"><p className="text-[13px] text-[#94A3B8]">No run selected</p><p className="text-[11px] text-[#64748B] mt-1">Select a running run to view live agent logs.</p></div>}</Card></div> */}
      <RecentIssues issues={issues} state={issuesState} onRetry={loadIssues} />
    </div>
  );
}
