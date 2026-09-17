import { issues } from '../data/issues';
import type { Issue } from '../types';

export const issuesService = {
  getAll(): Promise<Issue[]> {
    return Promise.resolve(issues);
  },

  getById(id: number): Promise<Issue | undefined> {
    return Promise.resolve(issues.find((i) => i.id === id));
  },

  getByStatus(status: string): Promise<Issue[]> {
    return Promise.resolve(issues.filter((i) => i.status === status));
  },
};
