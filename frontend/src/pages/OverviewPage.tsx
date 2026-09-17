import { CircleDot, Activity, GitPullRequest, Zap } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import RunsChart from '../components/dashboard/RunsChart';
import RecentActivity from '../components/dashboard/RecentActivity';
import RepositorySummary from '../components/dashboard/RepositorySummary';

export default function OverviewPage() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-semibold text-[#F8FAFC]">
          {greeting}, Abhinav
        </h1>
        <p className="text-[14px] text-[#94A3B8] mt-1">
          Here's what's happening with your repository.{' '}
          <span className="font-mono text-[13px] text-[#64748B]">
            Hrick-08/SWEPilot · Connected
          </span>
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Open Issues"
          value={12}
          subtitle="+2 new"
          icon={CircleDot}
          iconColor="#3B82F6"
        />
        <StatCard
          title="Runs Completed"
          value={21}
          subtitle="87.5% success rate"
          icon={Activity}
          iconColor="#22C55E"
        />
        <StatCard
          title="Currently Running"
          value={1}
          subtitle="In progress"
          icon={Zap}
          iconColor="#8B5CF6"
        />
        <StatCard
          title="Pull Requests"
          value={6}
          subtitle="3 awaiting review"
          icon={GitPullRequest}
          iconColor="#F59E0B"
        />
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3">
          <RunsChart />
        </div>
        <div className="xl:col-span-2">
          <RecentActivity />
        </div>
      </div>

      {/* Repository Summary */}
      <RepositorySummary />
    </div>
  );
}
