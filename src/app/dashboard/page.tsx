import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  MessageSquare,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  // Get connected accounts count
  const accountCount = await db.connectedAccount.count({
    where: { userId: session!.user!.id },
  });

  // Get comment stats
  const totalComments = await db.comment.count({
    where: {
      parentPost: {
        connectedAccount: { userId: session!.user!.id },
      },
    },
  });

  const unrepliedComments = await db.comment.count({
    where: {
      parentPost: {
        connectedAccount: { userId: session!.user!.id },
      },
      isReply: false,
      repliedAt: null,
    },
  });

  // Get recent comments
  const recentComments = await db.comment.findMany({
    where: {
      parentPost: {
        connectedAccount: { userId: session!.user!.id },
      },
      isReply: false,
    },
    include: {
      parentPost: {
        include: { connectedAccount: true },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: 5,
  });

  const stats = [
    {
      label: "Total Comments",
      value: totalComments.toLocaleString(),
      icon: MessageSquare,
      color: "text-brand-600 bg-brand-50",
    },
    {
      label: "Unreplied",
      value: unrepliedComments.toLocaleString(),
      icon: AlertCircle,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Connected Accounts",
      value: accountCount.toString(),
      icon: TrendingUp,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Avg. Response Time",
      value: "—",
      icon: Clock,
      color: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {session!.user!.name?.split(" ")[0]}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Here&apos;s what&apos;s happening across your accounts
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-border p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-muted">{stat.label}</p>
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}
              >
                <stat.icon className="h-4.5 w-4.5" />
              </div>
            </div>
            <p className="text-3xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Empty state or recent comments */}
      {accountCount === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-7 w-7 text-brand-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Connect your first account
          </h2>
          <p className="text-text-secondary text-sm max-w-md mx-auto mb-6">
            Link your Instagram, TikTok, YouTube, or Twitter account to start
            seeing comments flow into your unified inbox.
          </p>
          <Link
            href="/dashboard/accounts"
            className="inline-flex items-center gap-2 bg-brand-600 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-brand-700 transition-colors"
          >
            Connect Account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold">Recent Comments</h2>
            <Link
              href="/dashboard/inbox"
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              View all
            </Link>
          </div>
          {recentComments.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-sm">
              No comments yet. They&apos;ll appear here once synced.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentComments.map((comment) => (
                <div key={comment.id} className="px-6 py-4 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-surface-alt flex items-center justify-center text-sm font-semibold text-text-muted shrink-0">
                    {comment.authorName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{comment.authorName}</span>
                      <span className="text-text-muted capitalize">
                        {comment.platform}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">
                      {comment.text}
                    </p>
                  </div>
                  {!comment.repliedAt && (
                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-medium shrink-0">
                      Unreplied
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
