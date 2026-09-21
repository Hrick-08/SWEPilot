export type IssueStatus = 'open' | 'closed' | 'in_progress';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';
export type RunStatus = 'running' | 'completed' | 'failed' | 'pending' | 'cancelled';
export type PRStatus = 'open' | 'closed' | 'merged';
export type LogLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'DEBUG';
export type StepStatus = 'completed' | 'running' | 'pending' | 'failed';

export interface Issue {
  id: number;
  title: string;
  status: IssueStatus;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  description: string;
  assignee?: string;
  repository: string;
  branch?: string;
  agentStatus?: RunStatus;
  pullRequestUrl?: string;
}

export interface Run {
  id: string | number;
  issueId: number;
  issueTitle: string;
  status: RunStatus;
  startedAt: string;
  duration?: string;
  branch?: string;
  repository: string;
  steps: RunStep[];
}

export interface RunStep {
  name: string;
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  duration?: string;
}

export interface PullRequest {
  id: number;
  issueId: number;
  title: string;
  status: PRStatus;
  branch: string;
  targetBranch: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  testsPassed: number;
  testsFailed: number;
  createdAt: string;
  updatedAt: string;
  commits: number;
  description: string;
  checks: StatusCheck[];
}

export interface StatusCheck {
  name: string;
  status: 'passed' | 'failed' | 'pending';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
}

export interface ChangedFile {
  path: string;
  additions: number;
  deletions: number;
  diff?: string;
}

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: string;
  suite?: string;
}

export interface Repository {
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  connected: boolean;
  openIssues: number;
  openPRs: number;
  mergedPRs: number;
  url: string;
}

export interface ActivityEvent {
  id: string;
  issueId: number;
  issueTitle: string;
  event: string;
  timestamp: string;
  status: 'success' | 'info' | 'warning' | 'error';
}
