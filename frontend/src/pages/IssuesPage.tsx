import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, ChevronRight } from 'lucide-react';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import StatusDot from '../components/ui/StatusDot';
import { issues } from '../data/issues';

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

  const filtered = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(search.toLowerCase()) ||
      `#${issue.id}`.includes(search);
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-semibold text-[#F8FAFC]">Issues</h1>
        <p className="text-[14px] text-[#94A3B8] mt-1">
          Repository issues being handled by SWEPilot.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <Input
            icon
            placeholder="Search issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#0D121C] border border-[#1E293B] rounded-lg text-[13px] text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
          <Button variant="secondary" size="md">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </Button>
        </div>
      </div>

      {/* Issue list */}
      <div className="bg-[#10151F] border border-[#1E293B] rounded-lg overflow-hidden">
        {filtered.map((issue, index) => (
          <Link
            key={issue.id}
            to={`/issues/${issue.id}`}
            className={`flex items-center gap-4 px-4 lg:px-5 py-3.5 hover:bg-[#161D2A] transition-colors ${
              index !== filtered.length - 1 ? 'border-b border-[#1E293B]' : ''
            }`}
          >
            <StatusDot
              status={issue.status}
              pulse={issue.agentStatus === 'running'}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] font-mono text-[#64748B]">
                  #{issue.id}
                </span>
                <span className="text-[14px] font-medium text-[#F8FAFC] truncate">
                  {issue.title}
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              {statusBadge(issue.status)}
              {issue.labels.map((label) => (
                <Badge key={label} variant={labelVariant(label)}>
                  {label}
                </Badge>
              ))}
            </div>

            <span className="hidden md:block text-[12px] text-[#64748B] flex-shrink-0 w-24 text-right">
              {issue.createdAt}
            </span>

            <ChevronRight className="w-4 h-4 text-[#64748B] flex-shrink-0" />
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-[14px] text-[#64748B]">
            No issues found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
