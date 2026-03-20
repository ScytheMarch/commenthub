import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return then.toLocaleDateString();
}

export function platformColor(platform: string): string {
  const colors: Record<string, string> = {
    instagram: "text-pink-500",
    tiktok: "text-cyan-400",
    youtube: "text-red-500",
    twitter: "text-sky-400",
  };
  return colors[platform] ?? "text-gray-400";
}

export function platformBg(platform: string): string {
  const colors: Record<string, string> = {
    instagram: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
    tiktok: "bg-gradient-to-br from-cyan-400 to-pink-500",
    youtube: "bg-red-600",
    twitter: "bg-sky-500",
  };
  return colors[platform] ?? "bg-gray-600";
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}
