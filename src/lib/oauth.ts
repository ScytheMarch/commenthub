import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const STATE_COOKIE = "oauth_state";
const VERIFIER_COOKIE = "oauth_code_verifier";
const COOKIE_MAX_AGE = 600; // 10 minutes

export async function getSessionUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

export async function generateState(): Promise<string> {
  const state = randomBytes(32).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return state;
}

export async function verifyState(requestState: string | null): Promise<boolean> {
  if (!requestState) return false;
  const cookieStore = await cookies();
  const stored = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);
  return stored === requestState;
}

// PKCE helpers for TikTok
export async function generateCodeVerifier(): Promise<string> {
  const verifier = randomBytes(32)
    .toString("base64url")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 64);
  const cookieStore = await cookies();
  cookieStore.set(VERIFIER_COOKIE, verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return verifier;
}

export async function getCodeVerifier(): Promise<string | null> {
  const cookieStore = await cookies();
  const verifier = cookieStore.get(VERIFIER_COOKIE)?.value ?? null;
  cookieStore.delete(VERIFIER_COOKIE);
  return verifier;
}

export function computeCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function oauthError(error: string): NextResponse {
  const url = new URL("/dashboard/accounts", process.env.NEXTAUTH_URL!);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export function oauthSuccess(platform: string): NextResponse {
  const url = new URL("/dashboard/accounts", process.env.NEXTAUTH_URL!);
  url.searchParams.set("connected", platform);
  return NextResponse.redirect(url);
}
