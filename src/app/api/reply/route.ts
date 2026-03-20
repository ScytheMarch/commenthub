import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/reply — reply to a comment on the platform
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { commentId, text } = await request.json();
  if (!commentId || !text?.trim()) {
    return NextResponse.json({ error: "Missing commentId or text" }, { status: 400 });
  }

  // Load comment with its post and connected account
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    include: {
      parentPost: {
        include: { connectedAccount: true },
      },
    },
  });

  if (!comment || comment.parentPost.connectedAccount.userId !== session.user.id) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const account = comment.parentPost.connectedAccount;
  const platform = comment.platform;

  try {
    if (platform === "tiktok") {
      await replyTikTok(account.accessToken, comment.platformCommentId, comment.parentPost.platformPostId, text);
    } else if (platform === "youtube") {
      await replyYouTube(account.accessToken, comment.platformCommentId, text);
    } else if (platform === "instagram") {
      await replyInstagram(account.accessToken, comment.platformCommentId, text);
    } else {
      return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
    }

    // Mark as replied in our database
    await db.comment.update({
      where: { id: commentId },
      data: {
        repliedAt: new Date(),
        ourReplyText: text.trim(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`Reply error (${platform}):`, err);
    return NextResponse.json(
      { error: "Failed to post reply", detail: String(err) },
      { status: 500 }
    );
  }
}

// ─── TikTok ──────────────────────────────────────────────

async function replyTikTok(
  accessToken: string,
  commentId: string,
  videoId: string,
  text: string
) {
  const res = await fetch(
    "https://open.tiktokapis.com/v2/comment/reply/",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_id: videoId,
        comment_id: commentId,
        text: text.trim(),
      }),
    }
  );

  const data = await res.json();
  if (!res.ok || (data.error?.code && data.error.code !== "ok")) {
    throw new Error(`TikTok reply failed: ${JSON.stringify(data)}`);
  }
}

// ─── YouTube ─────────────────────────────────────────────

async function replyYouTube(
  accessToken: string,
  parentCommentId: string,
  text: string
) {
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/comments?part=snippet",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: {
          parentId: parentCommentId,
          textOriginal: text.trim(),
        },
      }),
    }
  );

  if (!res.ok) {
    const data = await res.json();
    throw new Error(`YouTube reply failed: ${JSON.stringify(data)}`);
  }
}

// ─── Instagram ───────────────────────────────────────────

async function replyInstagram(
  accessToken: string,
  commentId: string,
  text: string
) {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${commentId}/replies`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text.trim(),
        access_token: accessToken,
      }),
    }
  );

  if (!res.ok) {
    const data = await res.json();
    throw new Error(`Instagram reply failed: ${JSON.stringify(data)}`);
  }
}
