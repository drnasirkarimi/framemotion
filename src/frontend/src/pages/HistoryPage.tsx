import { useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  Clock,
  Download,
  Eye,
  Film,
  Share2,
  Trash2,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { cn } from "@/lib/utils";
import { EmptyState } from "../components/ui/EmptyState";
import { JobStatusBadge } from "../components/ui/JobStatusBadge";
import { HistoryGridSkeleton } from "../components/ui/LoadingSkeleton";
import { useDeleteJob, useJobs } from "../hooks/use-jobs";
import { JobStatus } from "../types/job";
import type { Job, JobStatusFilter } from "../types/job";

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

const FILTER_TABS: { label: string; value: JobStatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Processing", value: "processing" },
  { label: "Failed", value: "failed" },
];

const FILTER_TAB_KEYS = [
  "tab-all",
  "tab-completed",
  "tab-processing",
  "tab-failed",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const diffSec = Math.floor((Date.now() - ms) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  return `${Math.floor(diffSec / 86400)} days ago`;
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getMotionLabel(intensity: bigint): string {
  const val = Number(intensity);
  if (val <= 3) return "Low";
  if (val <= 6) return "Medium";
  return "High";
}

function toBackendStatus(filter: JobStatusFilter): JobStatus | null {
  if (filter === "all") return null;
  return JobStatus[filter as keyof typeof JobStatus] ?? null;
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

interface JobCardProps {
  job: Job;
  index: number;
  onView: (job: Job) => void;
  onDelete: (job: Job) => void;
}

function JobCard({ job, index, onView, onDelete }: JobCardProps) {
  const isProcessing =
    job.status === JobStatus.processing || job.status === JobStatus.queued;
  const isCompleted = job.status === JobStatus.completed;
  const imageUrl = job.inputImage.getDirectURL();

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={cn(
        "group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-card",
        "hover:shadow-elevated hover:border-primary/30 transition-smooth",
        isProcessing && "animate-pulse-subtle",
      )}
      data-ocid={`history.item.${index + 1}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Source file"
            className="w-full h-full object-cover transition-smooth group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {/* Status badge — top-right */}
        <div className="absolute top-2 right-2">
          <JobStatusBadge status={job.status} />
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Meta row */}
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 min-w-0 truncate">
            <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {formatRelativeTime(job.createdAt)}
            </span>
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <Zap className="w-3.5 h-3.5" aria-hidden />
            {getMotionLabel(job.motionIntensity)} motion
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 gap-1.5 text-xs"
            onClick={() => onView(job)}
            data-ocid={`history.view_button.${index + 1}`}
          >
            <Eye className="w-3.5 h-3.5" aria-hidden />
            View
          </Button>

          {isCompleted && job.outputVideoUrl && (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 gap-1.5 text-xs"
              asChild
            >
              <a
                href={job.outputVideoUrl}
                download
                data-ocid={`history.download_button.${index + 1}`}
              >
                <Download className="w-3.5 h-3.5" aria-hidden />
                Download
              </a>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-8 h-8"
            onClick={() => onDelete(job)}
            aria-label="Delete job"
            data-ocid={`history.delete_button.${index + 1}`}
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

interface DetailDialogProps {
  job: Job | null;
  open: boolean;
  onClose: () => void;
}

function DetailDialog({ job, open, onClose }: DetailDialogProps) {
  if (!job) return null;

  const isCompleted = job.status === JobStatus.completed;
  const imageUrl = job.inputImage.getDirectURL();

  const handleShare = async () => {
    if (!job.outputVideoUrl) return;
    try {
      await navigator.clipboard.writeText(job.outputVideoUrl);
      toast.success("Video URL copied to clipboard");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-3xl w-full p-0 overflow-hidden rounded-xl"
        data-ocid="history.dialog"
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="font-display text-lg">
            Conversion Details
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Media grid */}
          <div
            className={cn(
              "grid gap-4",
              isCompleted ? "sm:grid-cols-2" : "grid-cols-1",
            )}
          >
            {/* Original image */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Original Image
              </p>
              <div className="aspect-video rounded-lg overflow-hidden bg-muted border border-border">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Original"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Output video */}
            {isCompleted && job.outputVideoUrl && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Generated Video
                </p>
                <div className="aspect-video rounded-lg overflow-hidden bg-muted border border-border">
                  <video
                    src={job.outputVideoUrl}
                    controls
                    className="w-full h-full object-cover"
                    preload="metadata"
                  >
                    <track kind="captions" />
                  </video>
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Status",
                value: <JobStatusBadge status={job.status} />,
              },
              {
                label: "Created",
                value: (
                  <span className="flex items-center gap-1 text-sm text-foreground">
                    <Clock
                      className="w-3.5 h-3.5 text-muted-foreground"
                      aria-hidden
                    />
                    {formatDate(job.createdAt)}
                  </span>
                ),
              },
              {
                label: "Motion",
                value: (
                  <span className="flex items-center gap-1 text-sm text-foreground">
                    <Zap
                      className="w-3.5 h-3.5 text-muted-foreground"
                      aria-hidden
                    />
                    {getMotionLabel(job.motionIntensity)} (
                    {Number(job.motionIntensity)}%)
                  </span>
                ),
              },
              {
                label: "Job ID",
                value: (
                  <span className="font-mono text-xs text-muted-foreground truncate block max-w-[120px]">
                    {job.id}
                  </span>
                ),
              },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <div>{value}</div>
              </div>
            ))}
          </div>

          {/* Error message */}
          {job.status === JobStatus.failed && job.errorMsg && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {job.errorMsg}
            </div>
          )}

          {/* Action buttons */}
          {isCompleted && job.outputVideoUrl && (
            <div className="flex items-center gap-3 pt-1">
              <Button
                asChild
                className="gap-2"
                data-ocid="history.download_button"
              >
                <a href={job.outputVideoUrl} download>
                  <Download className="w-4 h-4" aria-hidden />
                  Download Video
                </a>
              </Button>
              <Button
                variant="secondary"
                className="gap-2"
                onClick={handleShare}
                data-ocid="history.share_button"
              >
                <Share2 className="w-4 h-4" aria-hidden />
                Share
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

interface DeleteDialogProps {
  job: Job | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

function DeleteDialog({
  job,
  open,
  onClose,
  onConfirm,
  isPending,
}: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent data-ocid="history.dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this conversion?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete job{" "}
            <span className="font-mono">{job?.id}</span> and all associated
            data. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onClose}
            data-ocid="history.cancel_button"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-ocid="history.confirm_button"
          >
            {isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function HistoryPage() {
  const navigate = useNavigate();

  const [filter, setFilter] = useState<JobStatusFilter>("all");
  const [page, setPage] = useState(0);
  const [viewJob, setViewJob] = useState<Job | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);

  const offset = page * PAGE_SIZE;
  const backendStatus = toBackendStatus(filter);

  const { data, isLoading } = useJobs(backendStatus, PAGE_SIZE, offset);
  const deleteJob = useDeleteJob();

  const jobs = data?.jobs ?? [];
  const total = Number(data?.total ?? 0);
  const hasMore = offset + PAGE_SIZE < total;

  const handleFilterChange = useCallback((f: JobStatusFilter) => {
    setFilter(f);
    setPage(0);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteJob.mutateAsync(deleteTarget.id);
      toast.success("Conversion deleted");
    } catch {
      toast.error("Failed to delete conversion");
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteJob]);

  // Sort newest first
  const sorted = [...jobs].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt),
  );

  return (
    <div className="min-h-screen bg-background" data-ocid="history.page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Conversion History
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading…"
              : `${total} conversion${total !== 1 ? "s" : ""} total`}
          </p>
        </div>

        {/* Filter tabs */}
        <div
          className="flex items-center gap-1 bg-muted/60 rounded-lg p-1 w-fit"
          role="tablist"
          aria-label="Filter conversions"
          data-ocid="history.filter.tab"
        >
          {FILTER_TABS.map(({ label, value }, idx) => (
            <button
              type="button"
              key={FILTER_TAB_KEYS[idx]}
              role="tab"
              aria-selected={filter === value}
              onClick={() => handleFilterChange(value)}
              className={cn(
                "relative px-4 py-1.5 text-sm font-medium rounded-md transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filter === value
                  ? "bg-card text-foreground shadow-subtle"
                  : "text-muted-foreground hover:text-foreground",
              )}
              data-ocid={`history.filter.${value}`}
            >
              {filter === value && (
                <motion.span
                  layoutId="active-tab"
                  className="absolute inset-0 rounded-md border-b-2 border-primary"
                  aria-hidden
                />
              )}
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>

        {/* Grid / States */}
        {isLoading ? (
          <HistoryGridSkeleton count={6} />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={Film}
            title="No conversions yet"
            description="Convert your first image to video and it will appear here."
            action={
              <Button
                onClick={() => navigate({ to: "/" })}
                data-ocid="history.start_converting_button"
                className="gap-2"
              >
                <Zap className="w-4 h-4" aria-hidden />
                Start Converting
              </Button>
            }
            data-ocid="history.empty_state"
          />
        ) : (
          <AnimatePresence mode="popLayout">
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              data-ocid="history.list"
            >
              {sorted.map((job, idx) => (
                <JobCard
                  key={job.id}
                  job={job}
                  index={idx}
                  onView={setViewJob}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Load More */}
        {hasMore && !isLoading && (
          <div className="flex justify-center pt-2">
            <Button
              variant="secondary"
              onClick={() => setPage((p) => p + 1)}
              className="gap-2 min-w-[140px]"
              data-ocid="history.load_more_button"
            >
              Load More
            </Button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <DetailDialog
        job={viewJob}
        open={!!viewJob}
        onClose={() => setViewJob(null)}
      />

      {/* Delete Confirmation */}
      <DeleteDialog
        job={deleteTarget}
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isPending={deleteJob.isPending}
      />
    </div>
  );
}
