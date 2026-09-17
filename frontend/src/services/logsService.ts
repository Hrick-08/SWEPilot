import { getJson, websocketUrl } from './api';
import type { LogEntry } from '../types';

/**
 * Log provider interface. When the WebSocket backend is ready,
 * implement WebSocketLogProvider with this same interface.
 */
export interface LogProvider {
  subscribe(issueId: number, callback: (logs: LogEntry[]) => void): () => void;
}

interface RunLookup {
  run_id: string;
}

interface BackendLogEvent {
  type: string;
  run_id: string;
  timestamp?: string;
  level?: string;
  message?: string;
}

function toLogEntry(event: BackendLogEvent, index: number): LogEntry | null {
  if (event.type !== 'log' || !event.message) return null;
  return {
    id: `${event.run_id}-${event.timestamp ?? index}`,
    timestamp: event.timestamp ?? new Date().toISOString(),
    level: (event.level ?? 'INFO') as LogEntry['level'],
    message: event.message,
  };
}

export class WebSocketLogProvider implements LogProvider {
  subscribe(issueId: number, callback: (logs: LogEntry[]) => void): () => void {
    let socket: WebSocket | undefined;
    let cancelled = false;

    const connect = async () => {
      try {
        const run = await getJson<RunLookup>(`/runs/${issueId}`);
        if (cancelled) return;

        const existing = await getJson<BackendLogEvent[]>(`/runs/${run.run_id}/logs`);
        const logs = existing
          .map((event, index) => toLogEntry(event, index))
          .filter((entry): entry is LogEntry => entry !== null);
        callback(logs);

        socket = new WebSocket(websocketUrl(`/ws/logs/${run.run_id}`));
        socket.onmessage = (message) => {
          const event = JSON.parse(message.data) as BackendLogEvent;
          const entry = toLogEntry(event, logs.length);
          if (!entry) return;
          logs.push(entry);
          callback([...logs]);
        };
      } catch {
        if (!cancelled) callback([]);
      }
    };

    void connect();

    return () => {
      cancelled = true;
      socket?.close();
    };
  }
}

export const logProvider: LogProvider = new WebSocketLogProvider();
