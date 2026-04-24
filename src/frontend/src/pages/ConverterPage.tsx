import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  Copy,
  Download,
  ImageIcon,
  Loader2,
  RefreshCw,
  Settings,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import { Slider } from "../components/ui/slider";
import { useBackend } from "../hooks/use-backend";
import { useJobPoller } from "../hooks/use-job-poller";
import {
  JOB_QUERY_KEY,
  useCreateJob,
  useJob,
  usePollJob,
} from "../hooks/use-jobs";
import { JobStatus } from "../types/job";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function motionLabel(value: number): string {
  if (value <= 3) return "Subtle";
  if (value <= 6) return "Natural";
  return "Dynamic";
}

// ─── API Key Settings Panel ──────────────────────────────────────────────────
function ApiKeyPanel({ onSaved }: { onSaved: () => void }) {
  const { backend } = useBackend();
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!apiKey.trim() || !backend) return;
    setSaving(true);
    try {
      await backend.setReplicateApiKey(apiKey.trim());
      localStorage.setItem("fm_api_key_set", "1");
      toast.success("API key saved successfully");
      onSaved();
    } catch {
      toast.error("Failed to save API key");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mb-6"
    >
      <Card className="border-primary/30 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <Settings className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground mb-1">
              Replicate API Key Required
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Enter your Replicate API key to start generating videos.
            </p>
            <div className="flex gap-2">
              <Input
                data-ocid="api_key.input"
                type="password"
                placeholder="r8_xxxxxxxxxxxxxxxxxxxxxxxx"
                value={apiKey}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setApiKey(e.target.value)
                }
                className="font-mono text-xs"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
              <Button
                data-ocid="api_key.save_button"
                onClick={handleSave}
                disabled={!apiKey.trim() || saving}
                size="sm"
                className="shrink-0"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Drop Zone ───────────────────────────────────────────────────────────────
function DropZone({
  onFile,
  disabled,
}: {
  onFile: (file: File) => void;
  disabled: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validate(file);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) validate(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  function validate(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP images are accepted");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 50 MB");
      return;
    }
    onFile(file);
  }

  return (
    <button
      type="button"
      data-ocid="converter.dropzone"
      aria-label="Drop image here or click to browse"
      className={cn(
        "relative flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed py-14 px-8 cursor-pointer transition-smooth text-left",
        dragging
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border hover:border-primary/50 hover:bg-muted/40",
        disabled && "pointer-events-none opacity-50",
      )}
      disabled={disabled}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
      <motion.div
        animate={
          dragging ? { scale: 1.15, rotate: -5 } : { scale: 1, rotate: 0 }
        }
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="mb-4 rounded-2xl bg-primary/10 p-4"
      >
        <CloudUpload className="h-8 w-8 text-primary" />
      </motion.div>
      <p className="text-base font-medium text-foreground mb-1">
        Drop your image here or click to browse
      </p>
      <p className="text-sm text-muted-foreground">
        JPG, PNG, WebP &middot; Max 50 MB
      </p>
    </button>
  );
}

// ─── Image Preview Card ───────────────────────────────────────────────────────
function ImagePreview({
  file,
  onClear,
}: {
  file: File;
  onClear: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative rounded-xl border border-border bg-card overflow-hidden shadow-card"
      style={{ width: 320 }}
    >
      {src ? (
        <img
          src={src}
          alt={file.name}
          className="w-full object-cover"
          style={{ maxHeight: 200 }}
        />
      ) : (
        <div className="flex h-32 items-center justify-center bg-muted">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <div className="p-3">
        <p
          className="truncate text-sm font-medium text-foreground"
          title={file.name}
        >
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </p>
      </div>
      <button
        type="button"
        data-ocid="converter.clear_image_button"
        onClick={onClear}
        aria-label="Remove image"
        className="absolute top-2 right-2 rounded-full bg-card/80 p-1 text-muted-foreground transition-smooth hover:bg-destructive hover:text-destructive-foreground backdrop-blur-sm"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

// ─── Progress Section ─────────────────────────────────────────────────────────
function ProcessingSection({ jobId }: { jobId: string }) {
  const { data: job } = useJob(jobId);
  const [elapsed, setElapsed] = useState(0);

  useJobPoller(
    job?.status === JobStatus.queued || job?.status === JobStatus.processing
      ? [jobId]
      : [],
  );

  const jobStatus = job?.status;

  useEffect(() => {
    if (
      !jobStatus ||
      (jobStatus !== JobStatus.queued && jobStatus !== JobStatus.processing)
    )
      return;
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [jobStatus]);

  if (!job) return null;

  const isActive =
    job.status === JobStatus.queued || job.status === JobStatus.processing;
  const statusText =
    job.status === JobStatus.queued
      ? "Queued — waiting for processing slot…"
      : "Generating your video…";

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="rounded-xl border border-primary/20 bg-primary/5 p-5"
      data-ocid="converter.loading_state"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
        </span>
        <p className="text-sm font-medium text-foreground">{statusText}</p>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {elapsed}s
        </span>
      </div>
      {job.status === JobStatus.queued && (
        <Progress className="h-1.5" value={10} />
      )}
      {job.status === JobStatus.processing && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ x: ["-100%", "200%"] }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 1.5,
              ease: "easeInOut",
            }}
            style={{ width: "40%" }}
          />
        </div>
      )}
    </motion.div>
  );
}

// ─── Video Result Section ─────────────────────────────────────────────────────
function VideoResult({
  jobId,
  onReset,
}: { jobId: string; onReset: () => void }) {
  const { data: job } = useJob(jobId);

  if (!job || job.status !== JobStatus.completed || !job.outputVideoUrl)
    return null;

  function handleDownload() {
    if (!job?.outputVideoUrl) return;
    const a = document.createElement("a");
    a.href = job.outputVideoUrl;
    a.download = "frameMotion-video.mp4";
    a.click();
  }

  function handleShare() {
    navigator.clipboard.writeText(job?.outputVideoUrl ?? "");
    toast.success("Video URL copied to clipboard");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      className="space-y-4"
      data-ocid="converter.success_state"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        Video generated successfully!
      </div>

      <div
        className="w-full overflow-hidden rounded-xl border border-border bg-card"
        style={{ maxWidth: 800 }}
      >
        {/* 16:9 */}
        <div className="relative" style={{ paddingBottom: "56.25%" }}>
          <video
            data-ocid="converter.canvas_target"
            src={job.outputVideoUrl}
            controls
            className="absolute inset-0 h-full w-full object-contain bg-black"
          >
            <track kind="captions" />
          </video>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          data-ocid="converter.download_button"
          onClick={handleDownload}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Download className="h-4 w-4" />
          Download MP4
        </Button>
        <Button
          data-ocid="converter.share_button"
          variant="outline"
          onClick={handleShare}
          className="gap-2"
        >
          <Copy className="h-4 w-4" />
          Share URL
        </Button>
        <Button
          data-ocid="converter.new_conversion_button"
          variant="ghost"
          onClick={onReset}
          className="gap-2 ml-auto text-muted-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          New conversion
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Error Section ────────────────────────────────────────────────────────────
function ErrorSection({
  jobId,
  onRetry,
}: { jobId: string; onRetry: () => void }) {
  const { data: job } = useJob(jobId);

  if (!job || job.status !== JobStatus.failed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
      data-ocid="converter.error_state"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">Generation failed</p>
        {job.errorMsg && (
          <p className="mt-1 text-xs text-muted-foreground break-words">
            {job.errorMsg}
          </p>
        )}
      </div>
      <Button
        data-ocid="converter.retry_button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="shrink-0 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </Button>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ConverterPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [motionIntensity, setMotionIntensity] = useState(5);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [needsApiKey, setNeedsApiKey] = useState(
    () => localStorage.getItem("fm_api_key_set") !== "1",
  );
  const [uploadProgress, setUploadProgress] = useState(0);

  const { backend, isReady } = useBackend();
  const createJob = useCreateJob();
  const pollJob = usePollJob();
  const queryClient = useQueryClient();
  const { data: activeJob } = useJob(activeJobId);

  // Detect if API key is missing by inspecting the returned config
  useEffect(() => {
    if (!isReady || !backend) return;
    // Config does not expose the key — show panel until the user explicitly saves
    // (persisted in localStorage so repeat visits don't re-prompt)
  }, [isReady, backend]);

  const isProcessing =
    activeJob?.status === JobStatus.queued ||
    activeJob?.status === JobStatus.processing;

  const isCompleted = activeJob?.status === JobStatus.completed;
  const isFailed = activeJob?.status === JobStatus.failed;

  function handleReset() {
    setSelectedFile(null);
    setActiveJobId(null);
    setUploadProgress(0);
    queryClient.invalidateQueries({ queryKey: [JOB_QUERY_KEY] });
  }

  const handleConvert = useCallback(async () => {
    if (!selectedFile || !backend) return;

    try {
      // Read file bytes and create ExternalBlob
      setUploadProgress(10);
      const fileData = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(fileData);
      const blob = ExternalBlob.fromBytes(bytes);

      // Build a data URL so Replicate can fetch the image
      const inputImageUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(selectedFile);
      });
      setUploadProgress(100);

      // Create job
      const jobId = await createJob.mutateAsync({
        inputImage: blob,
        inputImageUrl,
        motionIntensity,
      });
      setActiveJobId(jobId);
      setUploadProgress(0);

      // Kick off first poll
      await pollJob.mutateAsync(jobId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Conversion failed";
      if (msg.toLowerCase().includes("api key")) {
        setNeedsApiKey(true);
      }
      setUploadProgress(0);
      toast.error(msg);
    }
  }, [selectedFile, backend, motionIntensity, createJob, pollJob]);

  const isSubmitting =
    createJob.isPending ||
    pollJob.isPending ||
    (uploadProgress > 0 && uploadProgress < 100);

  return (
    <div
      className="mx-auto max-w-2xl px-4 py-10 space-y-6"
      data-ocid="converter.page"
    >
      {/* Page heading */}
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Image → Video
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload an image and our AI will animate it into a smooth video clip.
        </p>
      </div>

      {/* API key panel */}
      <AnimatePresence>
        {needsApiKey && !isCompleted && (
          <ApiKeyPanel onSaved={() => setNeedsApiKey(false)} />
        )}
      </AnimatePresence>

      {/* Upload / preview area */}
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DropZone
              onFile={setSelectedFile}
              disabled={isSubmitting || isProcessing}
            />
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex items-start gap-6"
          >
            <ImagePreview
              file={selectedFile}
              onClear={() => {
                if (!isSubmitting && !isProcessing) {
                  setSelectedFile(null);
                  setActiveJobId(null);
                }
              }}
            />

            {/* Motion intensity & convert */}
            <div className="flex-1 min-w-0 space-y-6 pt-2">
              {/* Motion intensity */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">
                    Motion Intensity
                  </Label>
                  <span className="text-sm font-semibold text-primary">
                    {motionIntensity} &mdash; {motionLabel(motionIntensity)}
                  </span>
                </div>
                <Slider
                  data-ocid="converter.motion_intensity_input"
                  min={1}
                  max={10}
                  step={1}
                  value={[motionIntensity]}
                  onValueChange={([v]) => setMotionIntensity(v)}
                  disabled={isSubmitting || isProcessing}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtle (1–3)</span>
                  <span>Natural (4–6)</span>
                  <span>Dynamic (7–10)</span>
                </div>
              </div>

              {/* Upload progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Uploading image…</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-1.5" />
                </div>
              )}

              {/* Generate button */}
              {!isProcessing && !isCompleted && (
                <Button
                  data-ocid="converter.generate_button"
                  onClick={handleConvert}
                  disabled={
                    !selectedFile || isSubmitting || needsApiKey || !isReady
                  }
                  className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    "Generate Video"
                  )}
                </Button>
              )}

              {/* Change image when not active */}
              {!isProcessing && (
                <Button
                  data-ocid="converter.change_image_button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setActiveJobId(null);
                  }}
                  disabled={isSubmitting}
                  className="w-full text-muted-foreground"
                >
                  Change Image
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress section */}
      <AnimatePresence>
        {activeJobId && isProcessing && (
          <ProcessingSection jobId={activeJobId} />
        )}
      </AnimatePresence>

      {/* Error section */}
      <AnimatePresence>
        {activeJobId && isFailed && (
          <ErrorSection jobId={activeJobId} onRetry={handleReset} />
        )}
      </AnimatePresence>

      {/* Video result */}
      <AnimatePresence>
        {activeJobId && isCompleted && (
          <VideoResult jobId={activeJobId} onReset={handleReset} />
        )}
      </AnimatePresence>
    </div>
  );
}
