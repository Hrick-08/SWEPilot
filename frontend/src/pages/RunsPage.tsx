import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Clock, GitBranch } from 'lucide-react';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import StatusDot from '../components/ui/StatusDot';
import { runsService } from '../services/runsService';
import type { Run } from '../types';

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

export default function RunsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [runs, setRuns] = useState<Run[]>([]);

  useEffect(() => {
    void runsService.getAll().then(setRuns).catch(() => setRuns([]));
  }, []);

  const filtered = runs.filter((run) => {
    const matchesSearch =
      run.issueTitle.toLowerCase().includes(search.toLowerCase()) ||
      `#${run.id}`.includes(search);
    const matchesStatus = statusFilter === 'all' || run.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-semibold text-[#F8FAFC]">Runs</h1>
        <p className="text-[14px] text-[#94A3B8] mt-1">
          Monitor agent executions across your repository.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <Input
            icon
            placeholder="Search runs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-[#0D121C] border border-[#1E293B] rounded-lg text-[13px] text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
        >
          <option value="all">All Status</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Runs table */}
      <div className="bg-[#10151F] border border-[#1E293B] rounded-lg overflow-hidden">
        {/* Header row - desktop only */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-2.5 border-b border-[#1E293B] text-[11px] font-medium text-[#64748B] uppercase tracking-wider">
          <div className="col-span-1">Run</div>
          <div className="col-span-4">Issue</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Started</div>
          <div className="col-span-2">Duration</div>
          <div className="col-span-1" />
        </div>

        {filtered.map((run, index) => (
          <Link
            key={run.id}
            to={`/runs/${run.id}`}
            className={`flex lg:grid lg:grid-cols-12 lg:gap-4 items-center px-4 lg:px-5 py-3.5 hover:bg-[#161D2A] transition-colors ${
              index !== filtered.length - 1 ? 'border-b border-[#1E293B]' : ''
            }`}
          >
            <div className="lg:col-span-1 mr-3 lg:mr-0">
              <StatusDot status={run.status} />
            </div>

            <div className="lg:col-span-4 flex-1 min-w-0 mr-3 lg:mr-0">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-mono text-[#64748B]">#{run.id}</span>
                <span className="text-[14px] font-medium text-[#F8FAFC] truncate">
                  {run.issueTitle}
                </span>
              </div>
              {run.branch && (
                <div className="flex items-center gap-1 mt-0.5 lg:hidden">
                  <GitBranch className="w-3 h-3 text-[#64748B]" />
                  <span className="text-[11px] font-mono text-[#64748B] truncate">
                    {run.branch}
                  </span>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 hidden sm:block">
              {statusBadge(run.status)}
            </div>

            <div className="lg:col-span-2 hidden md:flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-[#64748B]" />
              <span className="text-[12px] text-[#94A3B8]">{run.startedAt}</span>
            </div>

            <div className="lg:col-span-2 hidden lg:block">
              <span className="text-[12px] font-mono text-[#94A3B8]">
                {run.duration ?? '—'}
              </span>
            </div>

            <div className="lg:col-span-1 flex justify-end">
              <ChevronRight className="w-4 h-4 text-[#64748B]" />
            </div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-[14px] text-[#64748B]">
            No runs found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
