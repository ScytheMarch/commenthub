"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { cn, platformBg } from "@/lib/utils";
import {
  Instagram,
  Youtube,
  Plus,
  Trash2,
  Link2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

interface Account {
  id: string;
  platform: string;
  username: string;
  avatarUrl: string | null;
  postCount: number;
  createdAt: string;
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.18 8.18 0 004.76 1.52V6.84a4.84 4.84 0 01-1-.15z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  tiktok: TikTokIcon,
  youtube: Youtube,
  twitter: XIcon,
};

const ERROR_MESSAGES: Record<string, string> = {
  auth_denied: "You denied access. Please try again and approve the permissions.",
  auth_failed: "Authorization failed. Please try again.",
  state_mismatch: "Security check failed. Please try again.",
  token_exchange_failed: "Failed to connect. Please try again.",
  profile_fetch_failed: "Could not fetch your profile. Please try again.",
  no_business_account: "No Instagram Business account found. You need a Business or Creator account linked to a Facebook Page.",
  no_youtube_channel: "No YouTube channel found on this Google account.",
  save_failed: "Failed to save your account. Please try again.",
  not_authenticated: "You need to be logged in. Please refresh and try again.",
};

const platforms = [
  {
    id: "instagram",
    name: "Instagram",
    description: "Connect your Instagram Business or Creator account",
    available: true,
  },
  {
    id: "tiktok",
    name: "TikTok",
    description: "Connect your TikTok account to manage comments",
    available: true,
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "Connect your YouTube channel",
    available: true,
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    description: "Connect your X account",
    available: false,
  },
];

export function AccountsClient({ accounts }: { accounts: Account[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Show toast from URL params (after OAuth redirect)
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected) {
      setToast({
        type: "success",
        message: `${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`,
      });
      // Clean URL
      router.replace("/dashboard/accounts", { scroll: false });
    } else if (error) {
      setToast({
        type: "error",
        message: ERROR_MESSAGES[error] ?? "Something went wrong. Please try again.",
      });
      router.replace("/dashboard/accounts", { scroll: false });
    }
  }, [searchParams, router]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  function handleConnect(platformId: string) {
    setConnecting(platformId);
    window.location.href = `/api/connect/${platformId}`;
  }

  async function handleDisconnect(accountId: string, platform: string) {
    if (!confirm(`Disconnect your ${platform} account? This will remove all synced posts and comments for this account.`)) {
      return;
    }

    setDisconnecting(accountId);
    try {
      const res = await fetch("/api/connect/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });

      if (res.ok) {
        setToast({ type: "success", message: `${platform} disconnected.` });
        router.refresh();
      } else {
        setToast({ type: "error", message: "Failed to disconnect. Try again." });
      }
    } catch {
      setToast({ type: "error", message: "Network error. Try again." });
    } finally {
      setDisconnecting(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Toast notification */}
      {toast && (
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm",
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold">Connected Accounts</h1>
        <p className="text-text-secondary text-sm mt-1">
          Link your social media accounts to start pulling in comments
        </p>
      </div>

      {/* Connected accounts */}
      {accounts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
            Active Connections
          </h2>
          {accounts.map((account) => {
            const Icon = platformIcons[account.platform] ?? Link2;
            const isDisconnecting = disconnecting === account.id;
            return (
              <div
                key={account.id}
                className="bg-white rounded-xl border border-border p-5 flex items-center gap-4"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-white",
                    platformBg(account.platform)
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">@{account.username}</p>
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Connected
                    </span>
                  </div>
                  <p className="text-sm text-text-muted capitalize">
                    {account.platform} &middot; {account.postCount} posts synced
                  </p>
                </div>
                <button
                  onClick={() => handleDisconnect(account.id, account.platform)}
                  disabled={isDisconnecting}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isDisconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Disconnect
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Available platforms */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
          Available Platforms
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {platforms.map((platform) => {
            const Icon = platformIcons[platform.id] ?? Link2;
            const isConnected = accounts.some(
              (a) => a.platform === platform.id
            );
            const isConnecting = connecting === platform.id;

            return (
              <button
                key={platform.id}
                disabled={!platform.available || isConnected || isConnecting}
                onClick={() => handleConnect(platform.id)}
                className={cn(
                  "text-left rounded-xl border p-5 transition-all",
                  platform.available && !isConnected
                    ? "bg-white border-border hover:border-brand-300 hover:shadow-md cursor-pointer"
                    : "bg-surface-alt border-border opacity-60 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-white",
                      platformBg(platform.id)
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{platform.name}</p>
                    {!platform.available && (
                      <span className="text-xs text-text-muted">
                        Coming soon
                      </span>
                    )}
                    {isConnected && (
                      <span className="text-xs text-green-600">
                        Already connected
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-text-secondary">
                  {platform.description}
                </p>
                {platform.available && !isConnected && (
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-brand-600">
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Connecting...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" /> Connect
                      </>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
