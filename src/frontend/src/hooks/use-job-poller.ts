import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useBackend } from "./use-backend";
import { JOB_QUERY_KEY } from "./use-jobs";

const POLL_INTERVAL_MS = 3000;

export function useJobPoller(jobIds: string[]) {
  const { backend, isReady } = useBackend();
  const queryClient = useQueryClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeIdsRef = useRef<string[]>(jobIds);

  useEffect(() => {
    activeIdsRef.current = jobIds;
  }, [jobIds]);

  useEffect(() => {
    if (!isReady || !backend || jobIds.length === 0) return;

    const poll = async () => {
      for (const id of activeIdsRef.current) {
        try {
          await backend.pollReplicateJob(id);
        } catch {
          // Silently ignore individual poll errors
        }
      }
      queryClient.invalidateQueries({ queryKey: [JOB_QUERY_KEY] });
    };

    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isReady, backend, jobIds.length, queryClient]);
}
