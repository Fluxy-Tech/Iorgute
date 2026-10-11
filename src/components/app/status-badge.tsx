import { cn } from "@/lib/utils";
import { STATUS_BADGE, STATUS_LABEL, type OrderStatusName } from "@/lib/constants";

export function StatusBadge({ status, className }: { status: OrderStatusName; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        STATUS_BADGE[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
