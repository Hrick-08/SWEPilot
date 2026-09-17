import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import StatusDot from '../ui/StatusDot';
import { recentActivity } from '../../data/activity';

export default function RecentActivity() {
  return (
    <Card className="flex-1 min-w-0">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[16px] font-semibold text-[#F8FAFC]">
            Recent activity
          </h3>
          <p className="text-[12px] text-[#64748B] mt-0.5">
            The latest events across your workspace
          </p>
        </div>
        <Link
          to="/runs"
          className="text-[12px] font-medium text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
        >
          View all
        </Link>
      </div>

      <div className="space-y-0">
        {recentActivity.map((event) => (
          <Link
            key={event.id}
            to={`/issues/${event.issueId}`}
            className="flex items-start gap-3 py-3 border-b border-[#1E293B] last:border-0 hover:bg-[#161D2A] -mx-4 lg:-mx-5 px-4 lg:px-5 transition-colors"
          >
            <div className="mt-1.5 flex-shrink-0">
              <StatusDot status={event.status} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-mono text-[#64748B]">
                  #{event.issueId}
                </span>
                <span className="text-[13px] font-medium text-[#F8FAFC] truncate">
                  {event.issueTitle}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[12px] text-[#94A3B8]">
                  {event.event}
                </span>
                <span className="text-[11px] text-[#64748B]">
                  {event.timestamp}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
