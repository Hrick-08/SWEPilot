import { repository } from '../data/repository';
import type { Repository } from '../types';

export const repositoryService = {
  get(): Promise<Repository> {
    return Promise.resolve(repository);
  },
};
