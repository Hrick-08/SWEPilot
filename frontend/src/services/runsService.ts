import { getJson } from './api';
import type { Run } from '../types';

interface BackendRun {
  run_id: string;
  issue_number: number;
  issue_title: string;
  repository: string | null;
  status: Run['status'];
  started_at: string;
  finished_at: string | null;
}

function mapRun(run: BackendRun): Run {
  return {
    id: run.run_id,
    issueId: run.issue_number,
    issueTitle: run.issue_title,
    status: run.status,
    startedAt: run.started_at,
    duration: run.finished_at ? `${run.finished_at}` : undefined,
    repository: run.repository ?? 'Unknown repository',
    steps: [],
  };
}

export const runsService = {
  async getAll(): Promise<Run[]> {
    const response = await getJson<BackendRun[]>('/runs');
    return response.map(mapRun);
  },

  async getById(id: string): Promise<Run | undefined> {
    const runs = await this.getAll();
    return runs.find((run) => run.id === id);
  },

  getChartData(): Promise<never[]> {
    return Promise.resolve([]);
  },
};
