import { NextResponse } from "next/server";
import {
  getSessionUserId,
  generateState,
  generateCodeVerifier,
  computeCodeChallenge,
  oauthError,
} from "@/lib/oauth";

export async function GET() {
  try {
    await getSessionUserId();
  } catch {
    return oauthError("not_authenticated");
  }

  const state = await generateState();
  const codeVerifier = await generateCodeVerifier();
  const codeChallenge = computeCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    response_type: "code",
    scope: "user.info.profile,user.info.stats,video.list",
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/connect/tiktok/callback`,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return NextResponse.redirect(
    `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`
  );
}
