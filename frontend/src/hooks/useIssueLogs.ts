import { useEffect, useState } from 'react';
import { logProvider } from '../services/logsService';
import type { LogEntry } from '../types';

/**
 * Hook to subscribe to logs for a given issue.
 * Uses the LogProvider abstraction so the UI doesn't care
 * whether logs come from mock data or a WebSocket.
 */
export function useIssueLogs(issueId: number) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);

  useEffect(() => {
    setLogs([]);
    setIsStreaming(true);

    const unsubscribe = logProvider.subscribe(issueId, (newLogs) => {
      setLogs(newLogs);
    });

    const timeout = setTimeout(() => setIsStreaming(false), 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [issueId]);

  return { logs, isStreaming };
}
