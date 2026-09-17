import { mockLogs } from '../data/logs';
import type { LogEntry } from '../types';

/**
 * Log provider interface. When the WebSocket backend is ready,
 * implement WebSocketLogProvider with this same interface.
 */
export interface LogProvider {
  subscribe(issueId: number, callback: (logs: LogEntry[]) => void): () => void;
}

/**
 * Mock implementation that returns static logs with simulated streaming.
 * Replace with WebSocketLogProvider when the backend is ready.
 */
export class MockLogProvider implements LogProvider {
  subscribe(issueId: number, callback: (logs: LogEntry[]) => void): () => void {
    const logs = mockLogs[issueId] ?? [];
    let index = 0;
    let cancelled = false;
    const delivered: LogEntry[] = [];

    const deliver = () => {
      if (cancelled || index >= logs.length) return;
      delivered.push(logs[index]!);
      callback([...delivered]);
      index++;
      if (index < logs.length) {
        setTimeout(deliver, 120);
      }
    };

    setTimeout(deliver, 200);

    return () => {
      cancelled = true;
    };
  }
}

// Singleton instance — swap this to WebSocketLogProvider later
export const logProvider: LogProvider = new MockLogProvider();
