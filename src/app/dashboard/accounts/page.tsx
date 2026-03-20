import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AccountsClient } from "./accounts-client";

export default async function AccountsPage() {
  const session = await auth();

  const accounts = await db.connectedAccount.findMany({
    where: { userId: session!.user!.id },
    include: {
      _count: { select: { posts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = accounts.map((a) => ({
    id: a.id,
    platform: a.platform,
    username: a.username,
    avatarUrl: a.avatarUrl,
    postCount: a._count.posts,
    createdAt: a.createdAt.toISOString(),
  }));

  return <AccountsClient accounts={serialized} />;
}
