import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, ChevronRight, CircleDot, Clock3, RefreshCw, Terminal, Wifi, WifiOff, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { getJson, websocketUrl } from '../services/api';
import { issuesService } from '../services/issuesService';
import { runsService } from '../services/runsService';
import type { Issue, LogEntry, Run, RunStatus } from '../types';

type RequestState = 'loading' | 'ready' | 'error';
type HealthState = 'loading' | 'online' | 'offline';
type LogConnection = 'idle' | 'loading' | 'connected' | 'reconnecting' | 'disconnected';

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' {
  if (status === 'open') return 'success';
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
  return <div className={`animate-pulse rounded-lg bg-[#161D2A] ${className}`} />;
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return <div className="py-10 text-center"><p className="text-[14px] font-medium text-[#F8FAFC]">{title}</p><p className="text-[12px] text-[#64748B] mt-1">{message}</p></div>;
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="flex items-center justify-between gap-4 py-4"><p className="text-[13px] text-[#EF4444]">{message}</p><button onClick={onRetry} className="inline-flex items-center gap-1.5 text-[12px] text-[#60A5FA] hover:text-white"><RefreshCw className="w-3.5 h-3.5" /> Retry</button></div>;
}

function StatCard({ title, value, icon: Icon }: { title: string; value: number; icon: typeof Activity }) {
  return <Card><div className="flex items-center justify-between"><p className="text-[12px] text-[#94A3B8]">{title}</p><Icon className="w-4 h-4 text-[#3B82F6]" /></div><p className="text-[26px] font-semibold text-[#F8FAFC] mt-3">{value}</p></Card>;
}

function RunRow({ run, selected, onSelect }: { run: Run; selected: boolean; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-[#1E293B] last:border-b-0 hover:bg-[#161D2A] transition-colors ${selected ? 'bg-[#3B82F6]/10' : ''}`}><Activity className={`w-4 h-4 flex-shrink-0 ${isRunning(run.status) ? 'text-[#3B82F6]' : 'text-[#64748B]'}`} /><div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><span className="text-[13px] font-medium text-[#F8FAFC] truncate">{run.issueTitle || `Issue #${run.issueId}`}</span><Badge variant={statusVariant(run.status)}>{statusLabel(run.status)}</Badge></div><div className="flex items-center gap-3 mt-1 text-[11px] text-[#64748B]"><span className="truncate">{run.repository || 'Repository not provided'}</span><span className="flex items-center gap-1"><Clock3 className="w-3 h-3" />{formatDate(run.startedAt)}</span></div></div><ChevronRight className="w-4 h-4 text-[#64748B] flex-shrink-0" /></button>;
}

function RecentIssues({ issues, state, onRetry }: { issues: Issue[]; state: RequestState; onRetry: () => void }) {
  const recentIssues = issues.slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 5);
  return <Card padding={false}><div className="flex items-center justify-between px-4 lg:px-5 py-4 border-b border-[#1E293B]"><div><h2 className="text-[15px] font-semibold text-[#F8FAFC]">Recent Issues</h2><p className="text-[12px] text-[#64748B] mt-1">Issues processed by SWEPilot.</p></div><Link to="/issues" className="text-[12px] text-[#60A5FA] hover:text-white">View all</Link></div>{state === 'loading' && <div className="space-y-2 p-4"><LoadingBlock /><LoadingBlock /><LoadingBlock /></div>}{state === 'error' && <div className="px-4"><ErrorState message="Issues could not be loaded." onRetry={onRetry} /></div>}{state === 'ready' && recentIssues.length === 0 && <EmptyState title="No issues yet" message="GitHub issues processed by SWEPilot will appear here." />}{state === 'ready' && recentIssues.map((issue) => <Link key={issue.id} to={`/issues/${issue.id}`} className="flex items-center gap-3 px-4 py-3 border-b border-[#1E293B] last:border-b-0 hover:bg-[#161D2A]"><CircleDot className="w-4 h-4 text-[#64748B] flex-shrink-0" /><div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><span className="text-[12px] font-mono text-[#64748B]">#{issue.id}</span><span className="text-[13px] text-[#F8FAFC] truncate">{issue.title}</span><Badge variant={statusVariant(issue.status)}>{statusLabel(issue.status)}</Badge></div><p className="text-[11px] text-[#64748B] mt-1 truncate">{issue.repository} · {formatDate(issue.updatedAt)} · {statusLabel(issue.agentStatus ?? 'unknown')}</p><div className="flex gap-1 mt-1">{issue.labels.map((label) => <Badge key={label}>{label}</Badge>)}</div></div><ChevronRight className="w-4 h-4 text-[#64748B]" /></Link>)}</Card>;
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

  return <div className="space-y-6"><div className="flex items-start justify-between gap-4 flex-wrap"><div><h1 className="text-[28px] font-semibold text-[#F8FAFC]">Overview</h1><p className="text-[14px] text-[#94A3B8] mt-1">Monitor your issues and agent activity in one place.</p></div><div className="flex items-center gap-2 text-[12px] text-[#94A3B8]"><span className={`w-2 h-2 rounded-full ${health === 'online' ? 'bg-[#22C55E]' : health === 'offline' ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'}`} />{health === 'online' ? 'API Online' : health === 'offline' ? 'API Offline' : 'Checking API'}</div></div>
  {runsState === 'loading' || issuesState === 'loading' ? <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">{[1, 2, 3, 4, 5].map((item) => <LoadingBlock key={item} className="h-28" />)}</div> : runsState === 'error' || issuesState === 'error' ? <Card><ErrorState message="Overview data could not be loaded." onRetry={() => { loadRuns(); loadIssues(); }} /></Card> : <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4"><StatCard title="Total Issues" value={issues.length} icon={CircleDot} /><StatCard title="Total Runs" value={runs.length} icon={Activity} /><StatCard title="Running" value={runningCount} icon={Terminal} /><StatCard title="Completed" value={completedCount} icon={CheckCircle2} /><StatCard title="Failed" value={failedCount} icon={XCircle} /></div>}
  {/* <div className="grid grid-cols-1 xl:grid-cols-5 gap-4"><Card padding={false} className="xl:col-span-3"><div className="px-4 lg:px-5 py-4 border-b border-[#1E293B]"><h2 className="text-[15px] font-semibold text-[#F8FAFC]">Recent Runs</h2><p className="text-[12px] text-[#64748B] mt-1">Your latest agent executions.</p></div>{runsState === 'loading' ? <div className="space-y-2 p-4"><LoadingBlock /><LoadingBlock /><LoadingBlock /></div> : runsState === 'error' ? <div className="px-4"><ErrorState message="Runs could not be loaded." onRetry={loadRuns} /></div> : sortedRuns.length === 0 ? <EmptyState title="No agent runs yet" message="Runs will appear here when SWEPilot processes an issue." /> : sortedRuns.slice(0, 5).map((run) => <RunRow key={run.id} run={run} selected={selectedRun?.id === run.id} onSelect={() => setSelectedRun(run)} />)}</Card><Card className="xl:col-span-2"><div className="flex items-center gap-2"><Terminal className="w-4 h-4 text-[#3B82F6]" /><h2 className="text-[15px] font-semibold text-[#F8FAFC]">Live Agent Execution</h2></div><p className="text-[12px] text-[#64748B] mt-1">{selectedRun ? selectedRun.issueTitle : 'Select a running run to view live agent logs.'}</p><select value={selectedRun && isRunning(selectedRun.status) ? String(selectedRun.id) : ''} onChange={(event) => setSelectedRun(activeRuns.find((run) => String(run.id) === event.target.value))} className="w-full mt-4 bg-[#0D121C] border border-[#1E293B] rounded-lg px-3 py-2 text-[12px] text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"><option value="">{activeRuns.length ? 'Select a running run' : 'No active agent runs'}</option>{activeRuns.map((run) => <option key={run.id} value={run.id}>{run.issueTitle || `Issue #${run.issueId}`}</option>)}</select>{selectedRun && isRunning(selectedRun.status) ? <><div className="flex items-center gap-1.5 mt-3 text-[11px] text-[#94A3B8]">{logConnection === 'connected' ? <Wifi className="w-3.5 h-3.5 text-[#22C55E]" /> : <WifiOff className="w-3.5 h-3.5 text-[#F59E0B]" />}{statusLabel(logConnection)}</div><div className="mt-3 h-56 overflow-y-auto rounded-lg bg-[#080B12] border border-[#1E293B] p-3 font-mono text-[11px] text-[#94A3B8]">{logs.length ? logs.map((log) => <div key={log.id} className="mb-1"><span className="text-[#64748B]">{log.timestamp ? formatDate(log.timestamp) : ''}</span> <span className="text-[#60A5FA]">[{log.level}]</span> {log.message}</div>) : <span className="text-[#64748B]">Waiting for agent logs...</span>}</div></> : <div className="mt-4 rounded-lg border border-dashed border-[#1E293B] py-10 text-center"><p className="text-[13px] text-[#94A3B8]">No run selected</p><p className="text-[11px] text-[#64748B] mt-1">Select a running run to view live agent logs.</p></div>}</Card></div> */}
  <RecentIssues issues={issues} state={issuesState} onRetry={loadIssues} /></div>;
}
