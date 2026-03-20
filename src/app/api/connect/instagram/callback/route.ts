import { NextRequest } from "next/server";
import { getSessionUserId, verifyState, oauthError, oauthSuccess } from "@/lib/oauth";
import { db } from "@/lib/db";

const GRAPH_BASE = "https://graph.facebook.com/v21.0";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) return oauthError("auth_denied");
  if (!code) return oauthError("auth_failed");

  const stateValid = await verifyState(state);
  if (!stateValid) return oauthError("state_mismatch");

  let userId: string;
  try {
    userId = await getSessionUserId();
  } catch {
    return oauthError("not_authenticated");
  }

  // Step 1: Exchange code for short-lived token
  let shortToken: string;
  try {
    const tokenRes = await fetch(
      `${GRAPH_BASE}/oauth/access_token?` +
        new URLSearchParams({
          client_id: process.env.FACEBOOK_APP_ID!,
          client_secret: process.env.FACEBOOK_APP_SECRET!,
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/connect/instagram/callback`,
          code,
        })
    );

    if (!tokenRes.ok) {
      console.error("IG short token failed:", await tokenRes.text());
      return oauthError("token_exchange_failed");
    }

    const data = await tokenRes.json();
    shortToken = data.access_token;
  } catch (err) {
    console.error("IG short token error:", err);
    return oauthError("token_exchange_failed");
  }

  // Step 2: Exchange for long-lived token (60 days)
  let longToken: string;
  let expiresIn: number;
  try {
    const longRes = await fetch(
      `${GRAPH_BASE}/oauth/access_token?` +
        new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: process.env.FACEBOOK_APP_ID!,
          client_secret: process.env.FACEBOOK_APP_SECRET!,
          fb_exchange_token: shortToken,
        })
    );

    if (!longRes.ok) {
      console.error("IG long token failed:", await longRes.text());
      return oauthError("token_exchange_failed");
    }

    const data = await longRes.json();
    longToken = data.access_token;
    expiresIn = data.expires_in ?? 5184000; // default 60 days
  } catch (err) {
    console.error("IG long token error:", err);
    return oauthError("token_exchange_failed");
  }

  // Step 3: Get Facebook Pages
  let igBusinessAccountId: string | null = null;
  try {
    const pagesRes = await fetch(
      `${GRAPH_BASE}/me/accounts?fields=id,name,instagram_business_account&access_token=${longToken}`
    );

    if (!pagesRes.ok) {
      console.error("IG pages fetch failed:", await pagesRes.text());
      return oauthError("profile_fetch_failed");
    }

    const pagesData = await pagesRes.json();

    for (const page of pagesData.data ?? []) {
      if (page.instagram_business_account?.id) {
        igBusinessAccountId = page.instagram_business_account.id;
        break;
      }
    }

    if (!igBusinessAccountId) {
      return oauthError("no_business_account");
    }
  } catch (err) {
    console.error("IG pages error:", err);
    return oauthError("profile_fetch_failed");
  }

  // Step 4: Get Instagram profile
  let username: string;
  let avatarUrl: string | null = null;
  try {
    const profileRes = await fetch(
      `${GRAPH_BASE}/${igBusinessAccountId}?fields=id,username,profile_picture_url&access_token=${longToken}`
    );

    if (!profileRes.ok) {
      console.error("IG profile fetch failed:", await profileRes.text());
      return oauthError("profile_fetch_failed");
    }

    const profile = await profileRes.json();
    username = profile.username;
    avatarUrl = profile.profile_picture_url ?? null;
  } catch (err) {
    console.error("IG profile error:", err);
    return oauthError("profile_fetch_failed");
  }

  // Step 5: Save to database
  try {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await db.connectedAccount.upsert({
      where: {
        platform_platformId: {
          platform: "instagram",
          platformId: igBusinessAccountId,
        },
      },
      create: {
        userId,
        platform: "instagram",
        platformId: igBusinessAccountId,
        username,
        accessToken: longToken,
        expiresAt,
        scope: "instagram_basic,instagram_manage_comments,pages_show_list",
        avatarUrl,
      },
      update: {
        accessToken: longToken,
        expiresAt,
        avatarUrl,
      },
    });
  } catch (err) {
    console.error("IG save error:", err);
    return oauthError("save_failed");
  }

  return oauthSuccess("instagram");
}
