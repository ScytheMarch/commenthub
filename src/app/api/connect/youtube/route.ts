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
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/connect/youtube/callback`,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
