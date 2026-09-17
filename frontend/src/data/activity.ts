import type { ActivityEvent } from '../types';

export const recentActivity: ActivityEvent[] = [
  {
    id: '1',
    issueId: 142,
    issueTitle: 'Fix authentication timeout',
    event: 'Run started',
    timestamp: '2 minutes ago',
    status: 'info',
  },
  {
    id: '2',
    issueId: 139,
    issueTitle: 'API validation bug',
    event: 'PR created',
    timestamp: '1 hour ago',
    status: 'success',
  },
  {
    id: '3',
    issueId: 137,
    issueTitle: 'Update dependency versions',
    event: 'Run completed',
    timestamp: '2 hours ago',
    status: 'success',
  },
  {
    id: '4',
    issueId: 135,
    issueTitle: 'Add unit tests for utils',
    event: 'Run failed',
    timestamp: '3 hours ago',
    status: 'error',
  },
  {
    id: '5',
    issueId: 130,
    issueTitle: 'Fix database connection pooling',
    event: 'Run completed',
    timestamp: '1 day ago',
    status: 'success',
  },
  {
    id: '6',
    issueId: 130,
    issueTitle: 'Fix database connection pooling',
    event: 'PR created',
    timestamp: '1 day ago',
    status: 'success',
  },
];
