import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExternalBlob } from "../backend";
import type { Job, JobListResult, JobStatus } from "../types/job";
import { useBackend } from "./use-backend";

export const JOB_QUERY_KEY = "jobs";

export function useJobs(
  filter: JobStatus | null = null,
  limit = 50,
  offset = 0,
) {
  const { backend, isReady } = useBackend();

  return useQuery<JobListResult>({
    queryKey: [JOB_QUERY_KEY, filter, limit, offset],
    queryFn: async () => {
      if (!backend) return { jobs: [], total: BigInt(0) };
      return backend.listJobs(filter, BigInt(limit), BigInt(offset));
    },
    enabled: isReady,
    refetchInterval: false,
  });
}

export function useJob(jobId: string | null) {
  const { backend, isReady } = useBackend();

  return useQuery<Job | null>({
    queryKey: [JOB_QUERY_KEY, "single", jobId],
    queryFn: async () => {
      if (!backend || !jobId) return null;
      return backend.getJob(jobId);
    },
    enabled: isReady && !!jobId,
  });
}

export function useCreateJob() {
  const { backend } = useBackend();
  const queryClient = useQueryClient();

  return useMutation<
    string,
    Error,
    { inputImage: ExternalBlob; inputImageUrl: string; motionIntensity: number }
  >({
    mutationFn: async ({ inputImage, inputImageUrl, motionIntensity }) => {
      if (!backend) throw new Error("Backend not ready");
      return backend.createJob(
        inputImage,
        inputImageUrl,
        BigInt(motionIntensity),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [JOB_QUERY_KEY] });
    },
  });
}

export function useDeleteJob() {
  const { backend } = useBackend();
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: async (jobId) => {
      if (!backend) throw new Error("Backend not ready");
      return backend.deleteJob(jobId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [JOB_QUERY_KEY] });
    },
  });
}

export function usePollJob() {
  const { backend } = useBackend();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (jobId) => {
      if (!backend) throw new Error("Backend not ready");
      return backend.pollReplicateJob(jobId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [JOB_QUERY_KEY] });
    },
  });
}
