import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import Card from '../ui/Card';
import { runsChartData } from '../../data/runs';

export default function RunsChart() {
  return (
    <Card className="flex-1">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[16px] font-semibold text-[#F8FAFC]">
            Runs Overview
          </h3>
          <p className="text-[12px] text-[#64748B] mt-0.5">
            Agent activity over the last 7 days
          </p>
        </div>
        <span className="px-2.5 py-1 text-[11px] font-medium text-[#94A3B8] bg-[#0D121C] border border-[#1E293B] rounded-md">
          This week
        </span>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={runsChartData}
            margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            barGap={2}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1E293B"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fill: '#64748B', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#1E293B' }}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#10151F',
                border: '1px solid #1E293B',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#F8FAFC',
              }}
              itemStyle={{ color: '#F8FAFC' }}
              cursor={{ fill: '#161D2A' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span style={{ color: '#94A3B8', fontSize: '12px' }}>{value}</span>
              )}
            />
            <Bar
              dataKey="failed"
              name="Failed"
              fill="#EF4444"
              radius={[3, 3, 0, 0]}
            />
            <Bar
              dataKey="running"
              name="Running"
              fill="#3B82F6"
              radius={[3, 3, 0, 0]}
            />
            <Bar
              dataKey="successful"
              name="Successful"
              fill="#22C55E"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
