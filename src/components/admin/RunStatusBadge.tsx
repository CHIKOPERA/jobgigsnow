type Status = "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

const STYLES: Record<Status, string> = {
  RUNNING: "bg-accent-iris text-ink",
  COMPLETED: "bg-accent-mint text-ink",
  FAILED: "bg-danger text-surface",
  CANCELLED: "bg-surface-sunk text-ink-muted",
};

export function RunStatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-[6px] px-2 text-label font-medium uppercase tracking-[0.04em] ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
