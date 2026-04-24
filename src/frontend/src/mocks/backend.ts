import type { backendInterface, Job, JobListResult, Config, JobStatus, _ImmutableObjectStorageCreateCertificateResult, _ImmutableObjectStorageRefillResult } from "../backend";
import { ExternalBlob } from "../backend";

const sampleJob1: Job = {
  id: "job-001",
  status: "completed" as unknown as JobStatus,
  inputImage: ExternalBlob.fromURL("https://picsum.photos/400/300"),
  inputImageUrl: "https://picsum.photos/400/300",
  userId: { toText: () => "user-001" } as any,
  createdAt: BigInt(Date.now() - 3600000) * BigInt(1000000),
  replicateId: "rep-001",
  motionIntensity: BigInt(5),
  updatedAt: BigInt(Date.now() - 1800000) * BigInt(1000000),
  outputVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  errorMsg: undefined,
};

const sampleJob2: Job = {
  id: "job-002",
  status: "processing" as unknown as JobStatus,
  inputImage: ExternalBlob.fromURL("https://picsum.photos/400/301"),
  inputImageUrl: "https://picsum.photos/400/301",
  userId: { toText: () => "user-001" } as any,
  createdAt: BigInt(Date.now() - 600000) * BigInt(1000000),
  replicateId: "rep-002",
  motionIntensity: BigInt(7),
  updatedAt: BigInt(Date.now() - 300000) * BigInt(1000000),
  outputVideoUrl: undefined,
  errorMsg: undefined,
};

const sampleJob3: Job = {
  id: "job-003",
  status: "failed" as unknown as JobStatus,
  inputImage: ExternalBlob.fromURL("https://picsum.photos/400/302"),
  inputImageUrl: "https://picsum.photos/400/302",
  userId: { toText: () => "user-001" } as any,
  createdAt: BigInt(Date.now() - 7200000) * BigInt(1000000),
  replicateId: undefined,
  motionIntensity: BigInt(3),
  updatedAt: BigInt(Date.now() - 7000000) * BigInt(1000000),
  outputVideoUrl: undefined,
  errorMsg: "Model timed out",
};

export const mockBackend: backendInterface = {
  createJob: async (_inputImage, _inputImageUrl, _motionIntensity) => "job-new-" + Date.now(),
  deleteJob: async (_jobId) => true,
  getConfig: async (): Promise<Config> => ({
    modelVersion: "3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
    modelId: "stability-ai/stable-video-diffusion",
  }),
  getJob: async (jobId) => {
    const jobs = [sampleJob1, sampleJob2, sampleJob3];
    return jobs.find((j) => j.id === jobId) ?? null;
  },
  listJobs: async (_filter, _limit, _offset): Promise<JobListResult> => ({
    total: BigInt(3),
    jobs: [sampleJob1, sampleJob2, sampleJob3],
  }),
  pollReplicateJob: async (_jobId) => undefined,
  setReplicateApiKey: async (_key) => undefined,
  transform: async (_input) => ({
    status: BigInt(200),
    body: new Uint8Array(),
    headers: [],
  }),
  updateJobStatus: async (_jobId, _status, _outputVideoUrl, _errorMsg) => undefined,
  _immutableObjectStorageBlobsAreLive: async (_hashes: Array<Uint8Array>): Promise<Array<boolean>> => [],
  _immutableObjectStorageBlobsToDelete: async (): Promise<Array<Uint8Array>> => [],
  _immutableObjectStorageConfirmBlobDeletion: async (_blobs: Array<Uint8Array>): Promise<void> => undefined,
  _immutableObjectStorageCreateCertificate: async (_blobHash: string): Promise<_ImmutableObjectStorageCreateCertificateResult> => ({
    method: "GET",
    blob_hash: "",
  }),
  _immutableObjectStorageRefillCashier: async (_info): Promise<_ImmutableObjectStorageRefillResult> => ({
    success: true,
    topped_up_amount: BigInt(0),
  }),
  _immutableObjectStorageUpdateGatewayPrincipals: async (): Promise<void> => undefined,
};
