import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { accountId } = await request.json();
  if (!accountId) {
    return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
  }

  // Verify the account belongs to this user
  const account = await db.connectedAccount.findFirst({
    where: { id: accountId, userId: session.user.id },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Delete the account and all associated posts/comments (cascade)
  await db.connectedAccount.delete({ where: { id: accountId } });

  return NextResponse.json({ success: true });
}
