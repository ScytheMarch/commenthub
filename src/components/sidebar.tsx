"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  LayoutDashboard,
  Inbox,
  Link2,
  Settings,
  BarChart3,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/inbox", label: "Inbox", icon: Inbox },
  { href: "/dashboard/accounts", label: "Accounts", icon: Link2 },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-white">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
        <MessageSquare className="h-6 w-6 text-brand-600" />
        <span className="text-lg font-bold tracking-tight">CommentHub</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-border">
        <div className="rounded-xl bg-brand-50 p-4">
          <p className="text-sm font-semibold text-brand-800">Free Plan</p>
          <p className="text-xs text-brand-600 mt-1">
            2 accounts connected
          </p>
          <button className="mt-3 w-full text-xs font-medium bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 transition-colors">
            Upgrade to Pro
          </button>
        </div>
      </div>
    </aside>
  );
}
