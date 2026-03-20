import { NextRequest } from "next/server";
import { getSessionUserId, verifyState, oauthError, oauthSuccess } from "@/lib/oauth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) return oauthError("auth_denied");
  if (!code) return oauthError("auth_failed");

  // Verify CSRF state
  const stateValid = await verifyState(state);
  if (!stateValid) return oauthError("state_mismatch");

  // Get authenticated user
  let userId: string;
  try {
    userId = await getSessionUserId();
  } catch {
    return oauthError("not_authenticated");
  }

  // Exchange code for tokens
  let tokenData: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/connect/youtube/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("YouTube token exchange failed:", errBody);
      return oauthError("token_exchange_failed");
    }

    tokenData = await tokenRes.json();
  } catch (err) {
    console.error("YouTube token exchange error:", err);
    return oauthError("token_exchange_failed");
  }

  // Fetch channel info
  let channelId: string;
  let channelTitle: string;
  let avatarUrl: string | null = null;

  try {
    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    if (!channelRes.ok) {
      const errBody = await channelRes.text();
      console.error("YouTube channel fetch failed:", errBody);
      return oauthError("profile_fetch_failed");
    }

    const channelData = await channelRes.json();
    const channel = channelData.items?.[0];

    if (!channel) {
      return oauthError("no_youtube_channel");
    }

    channelId = channel.id;
    channelTitle = channel.snippet.title;
    avatarUrl = channel.snippet.thumbnails?.default?.url ?? null;
  } catch (err) {
    console.error("YouTube channel fetch error:", err);
    return oauthError("profile_fetch_failed");
  }

  // Save to database
  try {
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    await db.connectedAccount.upsert({
      where: {
        platform_platformId: {
          platform: "youtube",
          platformId: channelId,
        },
      },
      create: {
        userId,
        platform: "youtube",
        platformId: channelId,
        username: channelTitle,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? null,
        expiresAt,
        scope: "youtube.readonly youtube.force-ssl",
        avatarUrl,
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? undefined,
        expiresAt,
        avatarUrl,
      },
    });
  } catch (err) {
    console.error("YouTube save error:", err);
    return oauthError("save_failed");
  }

  return oauthSuccess("youtube");
}
