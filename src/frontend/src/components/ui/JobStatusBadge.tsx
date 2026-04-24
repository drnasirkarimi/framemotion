import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { JobStatus } from "../../types/job";

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; icon: React.ElementType; classes: string }
> = {
  [JobStatus.queued]: {
    label: "Queued",
    icon: Clock,
    classes: "bg-muted text-muted-foreground",
  },
  [JobStatus.processing]: {
    label: "Processing",
    icon: Loader2,
    classes: "bg-primary/10 text-primary",
  },
  [JobStatus.completed]: {
    label: "Completed",
    icon: CheckCircle2,
    classes: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  [JobStatus.failed]: {
    label: "Failed",
    icon: XCircle,
    classes: "bg-destructive/10 text-destructive",
  },
};

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG[JobStatus.queued];
  const Icon = config.icon;
  const isProcessing = status === JobStatus.processing;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        config.classes,
        className,
      )}
    >
      <Icon
        className={cn("w-3 h-3", isProcessing && "animate-spin")}
        aria-hidden
      />
      {config.label}
    </span>
  );
}
