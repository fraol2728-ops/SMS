"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  Send,
  Settings,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { generateCaption } from "@/lib/actions/scheduler-ai";
import {
  cancelScheduledPost,
  createScheduledPost,
} from "@/lib/actions/telegram";

type SchedulerChannel = { id: string; name: string };
type SchedulerPost = {
  id: string;
  status: string;
  content: string;
  scheduledFor: string | Date;
  aiGenerated: boolean;
  errorMessage?: string | null;
  channel: { name: string };
  createdBy: { firstName: string; lastName: string };
};

type SchedulerClientProps = {
  channels: SchedulerChannel[];
  posts: SchedulerPost[];
  canCreate: boolean;
  isSuperAdmin: boolean;
};

export function SchedulerClient({
  channels,
  posts,
  canCreate,
  isSuperAdmin,
}: SchedulerClientProps) {
  const router = useRouter();
  const [showCompose, setShowCompose] = useState(false);
  const [content, setContent] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [channelId, setChannelId] = useState(channels[0]?.id ?? "");
  const [scheduledFor, setScheduledFor] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [posting, setPosting] = useState(false);
  const [wasAiGenerated, setWasAiGenerated] = useState(false);

  async function handleGenerateAI() {
    if (!aiPrompt.trim())
      return toast.error("Describe what the post should be about");
    setAiLoading(true);
    try {
      const res = await generateCaption(aiPrompt);
      if (res.success) {
        setContent(res.data.caption);
        setWasAiGenerated(true);
        toast.success("Caption generated ✨");
      } else toast.error(res.error);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSchedule(publishNow: boolean) {
    if (!content.trim())
      return toast.error("Write or generate a caption first");
    if (!channelId) return toast.error("Select a channel");
    if (!publishNow && !scheduledFor)
      return toast.error("Pick a date and time");
    setPosting(true);
    try {
      const formData = new FormData();
      formData.set("channelId", channelId);
      formData.set("content", content);
      formData.set("imageUrl", imageUrl);
      formData.set(
        "scheduledFor",
        publishNow ? new Date().toISOString() : scheduledFor,
      );
      formData.set("aiGenerated", String(wasAiGenerated));
      formData.set("publishNow", String(publishNow));
      const res = await createScheduledPost(formData);
      if (res.success) {
        toast.success(
          publishNow ? "Posted to Telegram! 🚀" : "Post scheduled ✓",
        );
        setShowCompose(false);
        setContent("");
        setAiPrompt("");
        setImageUrl("");
        setScheduledFor("");
        setWasAiGenerated(false);
        router.refresh();
      } else toast.error(res.error);
    } finally {
      setPosting(false);
    }
  }

  async function handleCancel(postId: string) {
    if (!confirm("Cancel this scheduled post?")) return;
    const res = await cancelScheduledPost(postId);
    if (res.success) {
      toast.success("Post cancelled");
      router.refresh();
    } else toast.error(res.error);
  }

  const statusStyle: Record<string, string> = {
    SCHEDULED:
      "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    PUBLISHED:
      "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    FAILED: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    CANCELLED: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  };
  const statusIcon: Record<string, typeof Clock> = {
    SCHEDULED: Clock,
    PUBLISHED: CheckCircle,
    FAILED: AlertCircle,
    CANCELLED: X,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-400">
          {channels.length === 0
            ? "No Telegram channels connected yet."
            : `${channels.length} channel${channels.length !== 1 ? "s" : ""} connected`}
        </p>
        <div className="flex gap-2">
          {isSuperAdmin && (
            <>
              <Link href="/super-admin/scheduler/channels">
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border dark:border-gray-700 text-sm font-medium rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Settings size={14} />
                  Channels
                </button>
              </Link>
              <Link href="/super-admin/scheduler/access">
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border dark:border-gray-700 text-sm font-medium rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Settings size={14} />
                  Access
                </button>
              </Link>
            </>
          )}
          {canCreate && channels.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCompose(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl transition-colors shadow-sm"
            >
              <Plus size={15} />
              New Post
            </button>
          )}
        </div>
      </div>
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            aria-label="Close compose modal"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCompose(false)}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
              <h2 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Send size={18} className="text-blue-600" />
                New Telegram Post
              </h2>
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="scheduler-channel"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Channel
                </label>
                <select
                  id="scheduler-channel"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className="h-10 w-full rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white px-3 text-sm"
                >
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30 rounded-2xl p-4 space-y-2">
                <label
                  htmlFor="ai-prompt"
                  className="text-sm font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-1.5"
                >
                  <Sparkles size={14} />
                  AI Caption Assistant
                </label>
                <div className="flex gap-2">
                  <input
                    id="ai-prompt"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. announce new Digital Marketing class starting Monday"
                    className="flex-1 h-9 px-3 rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={aiLoading}
                    className="px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
                  >
                    {aiLoading ? "..." : "Generate"}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="post-content"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Post Content
                </label>
                <textarea
                  id="post-content"
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setWasAiGenerated(false);
                  }}
                  rows={5}
                  placeholder="Write your post or generate one above..."
                  className="w-full rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white p-3 text-sm resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="image-url"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Image URL (optional)
                </label>
                <input
                  id="image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-10 w-full rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white px-3 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="scheduled-for"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Schedule For
                </label>
                <input
                  id="scheduled-for"
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="h-10 w-full rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white px-3 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSchedule(false)}
                  disabled={posting}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-colors"
                >
                  {posting ? "Scheduling..." : "Schedule Post"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSchedule(true)}
                  disabled={posting}
                  className="px-5 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-colors"
                >
                  Post Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-dashed dark:border-gray-700 rounded-2xl p-12 text-center">
            <Calendar
              size={36}
              className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
            />
            <p className="text-gray-400 font-semibold">
              No posts scheduled yet
            </p>
          </div>
        ) : (
          posts.map((post) => {
            const Icon = statusIcon[post.status];
            return (
              <div
                key={post.id}
                className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl p-4 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${statusStyle[post.status]}`}
                    >
                      <Icon size={11} />
                      {post.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {post.channel.name}
                    </span>
                    {post.aiGenerated && (
                      <span className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                        <Sparkles size={10} /> AI
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {post.content}
                  </p>
                  {post.errorMessage && (
                    <p className="text-xs text-red-500 mt-1">
                      {post.errorMessage}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5">
                    {new Date(post.scheduledFor).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" • by "}
                    {post.createdBy.firstName} {post.createdBy.lastName}
                  </p>
                </div>
                {post.status === "SCHEDULED" && canCreate && (
                  <button
                    type="button"
                    onClick={() => handleCancel(post.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
