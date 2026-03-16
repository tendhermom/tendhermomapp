import { motion } from "framer-motion";
import IonIcon from "@/components/IonIcon";
import type { CommunityPost } from "@/stores/communityStore";

interface CommunityCardProps {
  post: CommunityPost;
  onLike: () => void;
  onComment: () => void;
}

const channelLabel: Record<string, string> = {
  general: "General",
  first_trimester: "1st Trimester",
  second_trimester: "2nd Trimester",
  third_trimester: "3rd Trimester",
  postpartum: "Postpartum",
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
};

const CommunityCard = ({ post, onLike, onComment }: CommunityCardProps) => {
  const initials = (post.author_name || "A")
    .split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: "hsl(var(--surface))", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
    >
      {/* Author row */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold font-sans shrink-0 overflow-hidden"
          style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}
        >
          {post.author_avatar ? (
            <img src={post.author_avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold font-sans truncate" style={{ color: "hsl(var(--dark))" }}>
            {post.author_name}
          </p>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-semibold font-sans uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: "hsl(var(--light-green))", color: "hsl(var(--green))" }}
            >
              {channelLabel[post.channel] || post.channel}
            </span>
            <span className="text-[11px] font-sans" style={{ color: "hsl(var(--text-muted))" }}>
              {timeAgo(post.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <p className="text-[14px] font-sans leading-relaxed whitespace-pre-wrap" style={{ color: "hsl(var(--dark))" }}>
        {post.content}
      </p>

      {/* Post image */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt=""
          className="w-full rounded-xl object-cover max-h-[260px]"
          loading="lazy"
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 pt-1">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onLike}
          className="flex items-center gap-1.5"
        >
          <IonIcon
            name={post.liked_by_me ? "heart" : "heart-outline"}
            size={18}
            style={{ color: post.liked_by_me ? "hsl(var(--coral))" : "hsl(var(--text-muted))" }}
          />
          <span
            className="text-[12px] font-sans font-medium"
            style={{ color: post.liked_by_me ? "hsl(var(--coral))" : "hsl(var(--text-muted))" }}
          >
            {post.likes_count || ""}
          </span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onComment}
          className="flex items-center gap-1.5"
        >
          <IonIcon name="chatbubble-outline" size={16} style={{ color: "hsl(var(--text-muted))" }} />
          <span className="text-[12px] font-sans font-medium" style={{ color: "hsl(var(--text-muted))" }}>
            {post.comments_count || ""}
          </span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          className="flex items-center gap-1.5 ml-auto"
        >
          <IonIcon name="share-outline" size={16} style={{ color: "hsl(var(--text-muted))" }} />
        </motion.button>
      </div>
    </div>
  );
};

export default CommunityCard;
