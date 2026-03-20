import { NextRequest } from "next/server";
import {
  getSessionUserId,
  verifyState,
  getCodeVerifier,
  oauthError,
  oauthSuccess,
} from "@/lib/oauth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) return oauthError("auth_denied");
  if (!code) return oauthError("auth_failed");

  const stateValid = await verifyState(state);
  if (!stateValid) return oauthError("state_mismatch");

  const codeVerifier = await getCodeVerifier();
  if (!codeVerifier) return oauthError("state_mismatch");

  let userId: string;
  try {
    userId = await getSessionUserId();
  } catch {
    return oauthError("not_authenticated");
  }

  // Exchange code for tokens
  let accessToken: string;
  let openId: string;
  let refreshToken: string | null = null;
  let expiresIn: number;

  try {
    const tokenRes = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
          code,
          grant_type: "authorization_code",
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/connect/tiktok/callback`,
          code_verifier: codeVerifier,
        }),
      }
    );

    if (!tokenRes.ok) {
      console.error("TikTok token exchange failed:", await tokenRes.text());
      return oauthError("token_exchange_failed");
    }

    const data = await tokenRes.json();
    accessToken = data.access_token;
    openId = data.open_id;
    refreshToken = data.refresh_token ?? null;
    expiresIn = data.expires_in ?? 86400;
  } catch (err) {
    console.error("TikTok token error:", err);
    return oauthError("token_exchange_failed");
  }

  // Fetch user info
  let displayName: string;
  let avatarUrl: string | null = null;

  try {
    const userRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!userRes.ok) {
      console.error("TikTok user fetch failed:", await userRes.text());
      return oauthError("profile_fetch_failed");
    }

    const userData = await userRes.json();
    const user = userData.data?.user;

    if (!user) {
      return oauthError("profile_fetch_failed");
    }

    displayName = user.display_name || `tiktok_${openId.slice(0, 8)}`;
    avatarUrl = user.avatar_url ?? null;
  } catch (err) {
    console.error("TikTok user error:", err);
    return oauthError("profile_fetch_failed");
  }

  // Save to database
  try {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await db.connectedAccount.upsert({
      where: {
        platform_platformId: {
          platform: "tiktok",
          platformId: openId,
        },
      },
      create: {
        userId,
        platform: "tiktok",
        platformId: openId,
        username: displayName,
        accessToken,
        refreshToken,
        expiresAt,
        scope: "user.info.basic,video.list,comment.list,comment.list.manage",
        avatarUrl,
      },
      update: {
        accessToken,
        refreshToken,
        expiresAt,
        avatarUrl,
      },
    });
  } catch (err) {
    console.error("TikTok save error:", err);
    return oauthError("save_failed");
  }

  return oauthSuccess("tiktok");
}
