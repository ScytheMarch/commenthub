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

  const serialized = comments.map((c) => ({
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

  return <InboxClient comments={serialized} />;
}
