import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Timestamp = bigint;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type JobId = string;
export interface Config {
    modelVersion: string;
    modelId: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type UserId = Principal;
export interface Job {
    id: JobId;
    status: JobStatus;
    inputImageUrl: string;
    inputImage: ExternalBlob;
    userId: UserId;
    createdAt: Timestamp;
    replicateId?: string;
    motionIntensity: bigint;
    updatedAt: Timestamp;
    outputVideoUrl?: string;
    errorMsg?: string;
}
export interface JobListResult {
    total: bigint;
    jobs: Array<Job>;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export enum JobStatus {
    completed = "completed",
    queued = "queued",
    processing = "processing",
    failed = "failed"
}
export interface backendInterface {
    createJob(inputImage: ExternalBlob, inputImageUrl: string, motionIntensity: bigint): Promise<JobId>;
    deleteJob(jobId: JobId): Promise<boolean>;
    getConfig(): Promise<Config>;
    getJob(jobId: JobId): Promise<Job | null>;
    listJobs(filter: JobStatus | null, limit: bigint, offset: bigint): Promise<JobListResult>;
    pollReplicateJob(jobId: JobId): Promise<void>;
    setReplicateApiKey(key: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateJobStatus(jobId: JobId, status: JobStatus, outputVideoUrl: string | null, errorMsg: string | null): Promise<void>;
}
