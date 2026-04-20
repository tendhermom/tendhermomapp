/**
 * Shared skeleton placeholders for slow-loading screens.
 * Uses subtle shimmer via Tailwind's animate-pulse and themed surfaces.
 */

const Bar = ({
  width = "100%",
  height = 12,
  rounded = "rounded-md",
}: {
  width?: string | number;
  height?: number;
  rounded?: string;
}) => (
  <div
    className={`animate-pulse ${rounded}`}
    style={{
      width: typeof width === "number" ? `${width}px` : width,
      height,
      background: "hsl(var(--muted))",
    }}
  />
);

/* Community / social post card */
export const PostCardSkeleton = () => (
  <div className="tend-card p-4 space-y-3">
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full animate-pulse"
        style={{ background: "hsl(var(--muted))" }}
      />
      <div className="flex-1 space-y-2">
        <Bar width={120} height={11} />
        <Bar width={70} height={9} />
      </div>
    </div>
    <div className="space-y-2">
      <Bar width="92%" />
      <Bar width="78%" />
    </div>
    <div className="flex gap-4 pt-1">
      <Bar width={50} height={10} />
      <Bar width={50} height={10} />
    </div>
  </div>
);

/* Notification list row */
export const NotificationSkeleton = () => (
  <div className="tend-card flex items-start gap-3 p-4">
    <div
      className="w-10 h-10 rounded-xl animate-pulse shrink-0"
      style={{ background: "hsl(var(--muted))" }}
    />
    <div className="flex-1 space-y-2 pt-1">
      <Bar width="60%" height={11} />
      <Bar width="90%" height={10} />
      <Bar width={40} height={9} />
    </div>
  </div>
);

/* Generic list row (referrals, contacts) */
export const ListItemSkeleton = () => (
  <div className="flex items-center px-4 py-3 gap-3">
    <div
      className="w-8 h-8 rounded-full animate-pulse shrink-0"
      style={{ background: "hsl(var(--muted))" }}
    />
    <div className="flex-1 space-y-1.5">
      <Bar width="55%" height={11} />
      <Bar width={60} height={9} />
    </div>
    <div
      className="w-14 h-5 rounded-full animate-pulse"
      style={{ background: "hsl(var(--muted))" }}
    />
  </div>
);

/* Place / hub result card */
export const PlaceCardSkeleton = () => (
  <div className="tend-card p-4 space-y-3">
    <div className="flex items-start gap-3">
      <div
        className="w-[42px] h-[42px] rounded-[12px] animate-pulse shrink-0"
        style={{ background: "hsl(var(--muted))" }}
      />
      <div className="flex-1 space-y-2 pt-1">
        <Bar width="65%" height={12} />
        <Bar width="90%" height={10} />
        <div className="flex gap-3 pt-1">
          <Bar width={50} height={9} />
          <Bar width={40} height={9} />
        </div>
      </div>
    </div>
    <Bar width="100%" height={36} rounded="rounded-xl" />
  </div>
);
