import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { InboxClient } from "./inbox-client";

export default async function InboxPage() {
  const session = await auth();

  const comments = await db.comment.findMany({
    where: {
      parentPost: {
        connectedAccount: { userId: session!.user!.id },
      },
      isReply: false,
    },
    include: {
      parentPost: {
        include: { connectedAccount: true },
      },
      replies: true,
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  const serializedComments = comments.map((c) => ({
    id: c.id,
    platform: c.platform,
    authorName: c.authorName,
    authorAvatar: c.authorAvatar,
    text: c.text,
    likeCount: c.likeCount,
    publishedAt: c.publishedAt?.toISOString() ?? null,
    repliedAt: c.repliedAt?.toISOString() ?? null,
    ourReplyText: c.ourReplyText,
    replyCount: c.replies.length,
    postCaption: c.parentPost.caption,
    postThumbnail: c.parentPost.thumbnailUrl,
    postPermalink: c.parentPost.permalink,
    accountUsername: c.parentPost.connectedAccount.username,
  }));

  // Also fetch synced posts so user can see what was pulled
  const posts = await db.post.findMany({
    where: {
      connectedAccount: { userId: session!.user!.id },
    },
    include: {
      connectedAccount: true,
      _count: { select: { comments: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  const serializedPosts = posts.map((p) => ({
    id: p.id,
    platform: p.platform,
    caption: p.caption,
    thumbnailUrl: p.thumbnailUrl,
    permalink: p.permalink,
    mediaType: p.mediaType,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    commentCount: p._count.comments,
    accountUsername: p.connectedAccount.username,
  }));

  return <InboxClient comments={serializedComments} posts={serializedPosts} />;
}
