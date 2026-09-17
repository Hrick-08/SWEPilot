import { runs, runsChartData } from '../data/runs';
import type { Run } from '../types';

export const runsService = {
  getAll(): Promise<Run[]> {
    return Promise.resolve(runs);
  },

  getById(id: number): Promise<Run | undefined> {
    return Promise.resolve(runs.find((r) => r.id === id));
  },

  getChartData() {
    return Promise.resolve(runsChartData);
  },
};
