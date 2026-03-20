"use client";

import { useState } from "react";
import { cn, timeAgo, platformBg } from "@/lib/utils";
import {
  Search,
  Heart,
  MessageCircle,
  ExternalLink,
  Send,
  Inbox,
  Loader2,
  Video,
} from "lucide-react";

interface Comment {
  id: string;
  platform: string;
  authorName: string;
  authorAvatar: string | null;
  text: string;
  likeCount: number;
  publishedAt: string | null;
  repliedAt: string | null;
  ourReplyText: string | null;
  replyCount: number;
  postCaption: string | null;
  postThumbnail: string | null;
  postPermalink: string | null;
  accountUsername: string;
}

interface Post {
  id: string;
  platform: string;
  caption: string | null;
  thumbnailUrl: string | null;
  permalink: string | null;
  mediaType: string | null;
  publishedAt: string | null;
  commentCount: number;
  accountUsername: string;
}

type FilterType = "all" | "unreplied" | "replied";
type PlatformFilter = "all" | "instagram" | "tiktok" | "youtube" | "twitter";

export function InboxClient({
  comments: initialComments,
  posts = [],
}: {
  comments: Comment[];
  posts?: Post[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [filter, setFilter] = useState<FilterType>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const filtered = comments.filter((c) => {
    if (filter === "unreplied" && c.repliedAt) return false;
    if (filter === "replied" && !c.repliedAt) return false;
    if (platformFilter !== "all" && c.platform !== platformFilter) return false;
    if (search && !c.text.toLowerCase().includes(search.toLowerCase()) && !c.authorName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null;

  async function handleReply() {
    if (!selected || !replyText.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId: selected.id, text: replyText.trim() }),
      });
      if (res.ok) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === selected.id
              ? { ...c, repliedAt: new Date().toISOString(), ourReplyText: replyText.trim() }
              : c
          )
        );
        setReplyText("");
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to send reply");
      }
    } catch {
      alert("Network error sending reply");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inbox</h1>
          <p className="text-text-secondary text-sm mt-1">
            {comments.length} comments across all platforms
          </p>
        </div>
      </div>

      {comments.length === 0 ? (
        <div className="space-y-6">
          {/* Synced posts section */}
          {posts.length > 0 && (
            <div className="bg-white rounded-2xl border border-border">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold">Synced Posts</h2>
                <p className="text-text-secondary text-sm mt-0.5">
                  {posts.length} posts pulled from your connected accounts
                </p>
              </div>
              <div className="divide-y divide-border">
                {posts.map((post) => (
                  <div key={post.id} className="px-6 py-4 flex items-center gap-4">
                    {post.thumbnailUrl ? (
                      <img
                        src={post.thumbnailUrl}
                        alt=""
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-surface-alt flex items-center justify-center shrink-0">
                        <Video className="h-6 w-6 text-text-muted" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {post.caption || "Untitled post"}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                        <span className="capitalize">{post.platform}</span>
                        <span>@{post.accountUsername}</span>
                        {post.publishedAt && (
                          <span>{timeAgo(post.publishedAt)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-text-muted">
                        {post.commentCount} comments
                      </span>
                      {post.permalink && (
                        <a
                          href={post.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:text-brand-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty comments message */}
          <div className="bg-white rounded-2xl border border-border p-16 text-center">
            <Inbox className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No comments yet</h2>
            <p className="text-text-secondary text-sm max-w-md mx-auto">
              {posts.length > 0
                ? "Your posts are synced but comments couldn't be pulled yet. This may be due to platform API restrictions in sandbox mode."
                : "Connect a social account and sync your posts to see comments here."}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          {/* Filters bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search comments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-surface-alt rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div className="flex items-center gap-1 bg-surface-alt rounded-lg p-1">
              {(["all", "unreplied", "replied"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize",
                    filter === f
                      ? "bg-white text-text-primary shadow-sm"
                      : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-surface-alt rounded-lg p-1">
              {(["all", "instagram", "tiktok", "youtube", "twitter"] as PlatformFilter[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(p)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize",
                    platformFilter === p
                      ? "bg-white text-text-primary shadow-sm"
                      : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Split view */}
          <div className="flex h-[calc(100vh-280px)] min-h-[500px]">
            {/* Comment list */}
            <div className="w-full md:w-[380px] border-r border-border overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-text-muted text-sm">
                  No comments match your filters
                </div>
              ) : (
                filtered.map((comment) => (
                  <button
                    key={comment.id}
                    onClick={() => setSelectedId(comment.id)}
                    className={cn(
                      "w-full text-left px-4 py-4 border-b border-border transition-colors",
                      selected?.id === comment.id
                        ? "bg-brand-50/50"
                        : "hover:bg-surface-hover"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          platformBg(comment.platform)
                        )}
                      />
                      <span className="text-sm font-medium truncate">
                        {comment.authorName}
                      </span>
                      <span className="text-xs text-text-muted ml-auto shrink-0">
                        {comment.publishedAt
                          ? timeAgo(comment.publishedAt)
                          : ""}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary line-clamp-2">
                      {comment.text}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                      <span className="capitalize">{comment.platform}</span>
                      {comment.likeCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" /> {comment.likeCount}
                        </span>
                      )}
                      {!comment.repliedAt && (
                        <span className="text-amber-600 font-medium">
                          Needs reply
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Detail panel */}
            <div className="hidden md:flex flex-1 flex-col">
              {selected ? (
                <>
                  <div className="flex-1 overflow-y-auto p-6">
                    {/* Post context */}
                    {(selected.postCaption || selected.postPermalink) && (
                      <div className="mb-6 p-4 rounded-xl bg-surface-alt border border-border">
                        <p className="text-xs text-text-muted mb-1 font-medium uppercase tracking-wide">
                          Original Post
                        </p>
                        {selected.postCaption && (
                          <p className="text-sm text-text-secondary line-clamp-3">
                            {selected.postCaption}
                          </p>
                        )}
                        {selected.postPermalink && (
                          <a
                            href={selected.postPermalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 mt-2"
                          >
                            View on {selected.platform}{" "}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Comment */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center text-sm font-semibold text-text-muted shrink-0">
                        {selected.authorName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {selected.authorName}
                          </span>
                          <span className="text-xs text-text-muted capitalize">
                            {selected.platform}
                          </span>
                          <span className="text-xs text-text-muted">
                            {selected.publishedAt
                              ? timeAgo(selected.publishedAt)
                              : ""}
                          </span>
                        </div>
                        <p className="text-sm mt-1 leading-relaxed">
                          {selected.text}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                          {selected.likeCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Heart className="h-3.5 w-3.5" />{" "}
                              {selected.likeCount} likes
                            </span>
                          )}
                          {selected.replyCount > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3.5 w-3.5" />{" "}
                              {selected.replyCount} replies
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Our reply if exists */}
                    {selected.ourReplyText && (
                      <div className="mt-6 ml-13 p-4 rounded-xl bg-brand-50 border border-brand-100">
                        <p className="text-xs text-brand-600 font-medium mb-1">
                          Your reply
                        </p>
                        <p className="text-sm">{selected.ourReplyText}</p>
                      </div>
                    )}
                  </div>

                  {/* Reply box */}
                  {!selected.repliedAt && (
                    <div className="p-4 border-t border-border">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={`Reply as @${selected.accountUsername}...`}
                          className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-border bg-surface-alt focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && replyText.trim()) {
                              handleReply();
                            }
                          }}
                          disabled={sending}
                        />
                        <button
                          onClick={handleReply}
                          disabled={!replyText.trim() || sending}
                          className="px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
                  Select a comment to view details
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
