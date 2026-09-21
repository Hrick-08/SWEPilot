import { getJson } from './api';
import type { Issue } from '../types';

interface BackendIssue {
  id: number;
  title: string;
  status: Issue['status'];
  labels: string[];
  created_at: string;
  updated_at: string;
  description: string;
  repository: string;
  agent_status: Issue['agentStatus'];
  pull_request_url?: string | null;
}

function mapIssue(issue: BackendIssue): Issue {
  return {
    id: issue.id,
    title: issue.title,
    status: issue.status,
    labels: issue.labels,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    description: issue.description,
    repository: issue.repository,
    agentStatus: issue.agent_status,
    pullRequestUrl: issue.pull_request_url ?? undefined,
  };
}

export const issuesService = {
  async getAll(): Promise<Issue[]> {
    const response = await getJson<BackendIssue[]>('/issues');
    return response.map(mapIssue);
  },

  async getById(id: number): Promise<Issue | undefined> {
    const issues = await this.getAll();
    return issues.find((issue) => issue.id === id);
  },

  async getByStatus(status: string): Promise<Issue[]> {
    const issues = await this.getAll();
    return issues.filter((issue) => issue.status === status);
  },
};
