// Re-export backend types for convenience
export { JobStatus } from "../backend";
export type { Job, JobId, JobListResult, Config } from "../backend";

export type JobStatusFilter =
  | "all"
  | "queued"
  | "processing"
  | "completed"
  | "failed";
