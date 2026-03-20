"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Menu, Bell, Search, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Topbar({ user }: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="h-16 flex items-center gap-4 px-6 border-b border-border bg-white shrink-0">
      {/* Mobile menu button */}
      <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-surface-hover">
        <Menu className="h-5 w-5 text-text-secondary" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search comments, posts, users..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-surface-alt rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-surface-hover transition-colors">
          <Bell className="h-5 w-5 text-text-secondary" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
          >
            {user.image ? (
              <img
                src={user.image}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-sm font-semibold text-brand-700">
                {user.name?.[0] ?? "U"}
              </div>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-border shadow-lg z-50 py-2">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-text-muted truncate">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
