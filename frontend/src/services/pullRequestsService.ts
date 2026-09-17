import { pullRequests } from '../data/pullRequests';
import type { PullRequest } from '../types';

export const pullRequestsService = {
  getAll(): Promise<PullRequest[]> {
    return Promise.resolve(pullRequests);
  },

  getById(id: number): Promise<PullRequest | undefined> {
    return Promise.resolve(pullRequests.find((pr) => pr.id === id));
  },

  getByStatus(status: string): Promise<PullRequest[]> {
    return Promise.resolve(pullRequests.filter((pr) => pr.status === status));
  },
};
