import { NextResponse } from "next/server";
import { getSessionUserId, generateState, oauthError } from "@/lib/oauth";

export async function GET() {
  try {
    await getSessionUserId();
  } catch {
    return oauthError("not_authenticated");
  }

  const state = await generateState();

  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/connect/instagram/callback`,
    response_type: "code",
    scope: "instagram_basic,instagram_manage_comments,pages_show_list",
    state,
  });

  return NextResponse.redirect(
    `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`
  );
}
