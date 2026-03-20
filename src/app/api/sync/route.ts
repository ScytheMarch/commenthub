import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/sync — sync posts + comments for a connected account
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { accountId } = await request.json();
  if (!accountId) {
    return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
  }

  // Verify ownership
  const account = await db.connectedAccount.findFirst({
    where: { id: accountId, userId: session.user.id },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  try {
    if (account.platform === "tiktok") {
      return await syncTikTok(account);
    }
    if (account.platform === "youtube") {
      return await syncYouTube(account);
    }
    if (account.platform === "instagram") {
      return await syncInstagram(account);
    }

    return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
  } catch (err) {
    console.error(`Sync error (${account.platform}):`, err);
    return NextResponse.json(
      { error: "Sync failed", detail: String(err) },
      { status: 500 }
    );
  }
}

// ─── TikTok ──────────────────────────────────────────────

interface TikTokVideo {
  id: string;
  title: string;
  cover_image_url: string;
  share_url: string;
  create_time: number;
  comment_count: number;
}

interface TikTokComment {
  id: string;
  text: string;
  create_time: number;
  like_count: number;
  parent_comment_id?: string;
  user: {
    open_id: string;
    display_name: string;
    avatar_url: string;
    profile_deep_link: string;
  };
}

async function syncTikTok(account: {
  id: string;
  accessToken: string;
  platform: string;
}) {
  const headers = {
    Authorization: `Bearer ${account.accessToken}`,
    "Content-Type": "application/json",
  };

  // 1) Fetch user's videos
  const videoRes = await fetch(
    "https://open.tiktokapis.com/v2/video/list/?fields=id,title,cover_image_url,share_url,create_time,comment_count",
    {
      method: "POST",
      headers,
      body: JSON.stringify({ max_count: 20 }),
    }
  );

  const videoData = await videoRes.json();

  if (videoData.error?.code !== "ok" && videoData.error?.code) {
    console.error("TikTok video list error:", videoData);
    return NextResponse.json(
      { error: "Failed to fetch videos", detail: videoData.error },
      { status: 502 }
    );
  }

  const videos: TikTokVideo[] = videoData.data?.videos ?? [];

  let postsSynced = 0;
  let commentsSynced = 0;

  for (const video of videos) {
    // Upsert the post
    const post = await db.post.upsert({
      where: {
        platform_platformPostId: {
          platform: "tiktok",
          platformPostId: video.id,
        },
      },
      create: {
        connectedAccountId: account.id,
        platformPostId: video.id,
        platform: "tiktok",
        caption: video.title || null,
        thumbnailUrl: video.cover_image_url || null,
        permalink: video.share_url || null,
        mediaType: "VIDEO",
        publishedAt: new Date(video.create_time * 1000),
      },
      update: {
        caption: video.title || null,
        thumbnailUrl: video.cover_image_url || null,
        permalink: video.share_url || null,
        lastSyncedAt: new Date(),
      },
    });
    postsSynced++;

    // 2) Fetch comments for this video (only if it has comments)
    if (video.comment_count > 0) {
      try {
        const commentRes = await fetch(
          "https://open.tiktokapis.com/v2/comment/list/?fields=id,text,create_time,like_count,parent_comment_id,user",
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              video_id: video.id,
              max_count: 50,
            }),
          }
        );

        const commentData = await commentRes.json();
        const comments: TikTokComment[] = commentData.data?.comments ?? [];

        for (const comment of comments) {
          const isReply = !!comment.parent_comment_id;

          // Find parent comment record if it's a reply
          let parentCommentId: string | null = null;
          if (isReply && comment.parent_comment_id) {
            const parent = await db.comment.findUnique({
              where: {
                platform_platformCommentId: {
                  platform: "tiktok",
                  platformCommentId: comment.parent_comment_id,
                },
              },
            });
            parentCommentId = parent?.id ?? null;
          }

          await db.comment.upsert({
            where: {
              platform_platformCommentId: {
                platform: "tiktok",
                platformCommentId: comment.id,
              },
            },
            create: {
              postId: post.id,
              platformCommentId: comment.id,
              platform: "tiktok",
              authorName: comment.user?.display_name ?? "TikTok User",
              authorAvatar: comment.user?.avatar_url ?? null,
              authorProfileUrl: comment.user?.profile_deep_link ?? null,
              text: comment.text,
              likeCount: comment.like_count ?? 0,
              isReply,
              parentCommentId,
              publishedAt: new Date(comment.create_time * 1000),
            },
            update: {
              text: comment.text,
              likeCount: comment.like_count ?? 0,
              authorName: comment.user?.display_name ?? "TikTok User",
              authorAvatar: comment.user?.avatar_url ?? null,
            },
          });
          commentsSynced++;
        }
      } catch (err) {
        // Non-fatal: skip comments for this video
        console.error(`Failed to fetch comments for video ${video.id}:`, err);
      }
    }
  }

  return NextResponse.json({
    success: true,
    platform: "tiktok",
    postsSynced,
    commentsSynced,
  });
}

// ─── YouTube ─────────────────────────────────────────────

async function syncYouTube(account: {
  id: string;
  accessToken: string;
  platform: string;
  platformId: string;
}) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const headers = { Authorization: `Bearer ${account.accessToken}` };

  // 1) Get channel uploads playlist
  const channelRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${account.platformId}`,
    { headers }
  );
  const channelData = await channelRes.json();
  const uploadsPlaylistId =
    channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) {
    return NextResponse.json({ error: "No uploads playlist found" }, { status: 404 });
  }

  // 2) Fetch recent videos from uploads playlist
  const playlistRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=20`,
    { headers }
  );
  const playlistData = await playlistRes.json();
  const items = playlistData.items ?? [];

  let postsSynced = 0;
  let commentsSynced = 0;

  for (const item of items) {
    const snippet = item.snippet;
    const videoId = snippet.resourceId?.videoId;
    if (!videoId) continue;

    const post = await db.post.upsert({
      where: {
        platform_platformPostId: {
          platform: "youtube",
          platformPostId: videoId,
        },
      },
      create: {
        connectedAccountId: account.id,
        platformPostId: videoId,
        platform: "youtube",
        caption: snippet.title || null,
        thumbnailUrl: snippet.thumbnails?.medium?.url || null,
        permalink: `https://www.youtube.com/watch?v=${videoId}`,
        mediaType: "VIDEO",
        publishedAt: snippet.publishedAt ? new Date(snippet.publishedAt) : null,
      },
      update: {
        caption: snippet.title || null,
        thumbnailUrl: snippet.thumbnails?.medium?.url || null,
        lastSyncedAt: new Date(),
      },
    });
    postsSynced++;

    // 3) Fetch comments for this video
    try {
      const commentRes = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=50&order=time`,
        { headers }
      );
      const commentData = await commentRes.json();

      for (const thread of commentData.items ?? []) {
        const topComment = thread.snippet.topLevelComment.snippet;
        await db.comment.upsert({
          where: {
            platform_platformCommentId: {
              platform: "youtube",
              platformCommentId: thread.snippet.topLevelComment.id,
            },
          },
          create: {
            postId: post.id,
            platformCommentId: thread.snippet.topLevelComment.id,
            platform: "youtube",
            authorName: topComment.authorDisplayName,
            authorAvatar: topComment.authorProfileImageUrl ?? null,
            authorProfileUrl: topComment.authorChannelUrl ?? null,
            text: topComment.textDisplay,
            likeCount: topComment.likeCount ?? 0,
            isReply: false,
            publishedAt: new Date(topComment.publishedAt),
          },
          update: {
            text: topComment.textDisplay,
            likeCount: topComment.likeCount ?? 0,
            authorName: topComment.authorDisplayName,
          },
        });
        commentsSynced++;
      }
    } catch (err) {
      console.error(`Failed to fetch comments for YouTube video ${videoId}:`, err);
    }
  }

  return NextResponse.json({
    success: true,
    platform: "youtube",
    postsSynced,
    commentsSynced,
  });
}

// ─── Instagram ───────────────────────────────────────────

async function syncInstagram(account: {
  id: string;
  accessToken: string;
  platform: string;
  platformId: string;
}) {
  const token = account.accessToken;

  // 1) Fetch recent media
  const mediaRes = await fetch(
    `https://graph.facebook.com/v21.0/${account.platformId}/media?fields=id,caption,thumbnail_url,permalink,media_type,timestamp&limit=20&access_token=${token}`
  );
  const mediaData = await mediaRes.json();
  const items = mediaData.data ?? [];

  let postsSynced = 0;
  let commentsSynced = 0;

  for (const item of items) {
    const post = await db.post.upsert({
      where: {
        platform_platformPostId: {
          platform: "instagram",
          platformPostId: item.id,
        },
      },
      create: {
        connectedAccountId: account.id,
        platformPostId: item.id,
        platform: "instagram",
        caption: item.caption || null,
        thumbnailUrl: item.thumbnail_url || null,
        permalink: item.permalink || null,
        mediaType: item.media_type || null,
        publishedAt: item.timestamp ? new Date(item.timestamp) : null,
      },
      update: {
        caption: item.caption || null,
        thumbnailUrl: item.thumbnail_url || null,
        permalink: item.permalink || null,
        lastSyncedAt: new Date(),
      },
    });
    postsSynced++;

    // 2) Fetch comments for this post
    try {
      const commentRes = await fetch(
        `https://graph.facebook.com/v21.0/${item.id}/comments?fields=id,text,username,timestamp,like_count&limit=50&access_token=${token}`
      );
      const commentData = await commentRes.json();

      for (const comment of commentData.data ?? []) {
        await db.comment.upsert({
          where: {
            platform_platformCommentId: {
              platform: "instagram",
              platformCommentId: comment.id,
            },
          },
          create: {
            postId: post.id,
            platformCommentId: comment.id,
            platform: "instagram",
            authorName: comment.username ?? "Instagram User",
            text: comment.text,
            likeCount: comment.like_count ?? 0,
            isReply: false,
            publishedAt: comment.timestamp ? new Date(comment.timestamp) : null,
          },
          update: {
            text: comment.text,
            likeCount: comment.like_count ?? 0,
          },
        });
        commentsSynced++;
      }
    } catch (err) {
      console.error(`Failed to fetch comments for IG post ${item.id}:`, err);
    }
  }

  return NextResponse.json({
    success: true,
    platform: "instagram",
    postsSynced,
    commentsSynced,
  });
}
