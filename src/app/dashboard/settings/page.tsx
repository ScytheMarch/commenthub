import { auth } from "@/lib/auth";
import { Settings } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">
          Manage your account preferences
        </p>
      </div>

      {/* Profile section */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt=""
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-2xl font-bold text-brand-700">
              {session?.user?.name?.[0] ?? "U"}
            </div>
          )}
          <div>
            <p className="font-semibold text-lg">{session?.user?.name}</p>
            <p className="text-sm text-text-muted">{session?.user?.email}</p>
          </div>
        </div>
      </div>

      {/* Plan section */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Free Plan</p>
            <p className="text-sm text-text-muted mt-1">
              Up to 2 connected accounts, 500 comments/month
            </p>
          </div>
          <button className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
            Upgrade
          </button>
        </div>
      </div>

      {/* Notifications section */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Notifications</h2>
        <div className="space-y-4">
          {[
            {
              label: "Email notifications",
              description: "Get notified about new comments via email",
            },
            {
              label: "Daily digest",
              description: "Receive a daily summary of your engagement",
            },
            {
              label: "Urgent alerts",
              description: "Get alerted when a post gets high engagement",
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-text-muted">{item.description}</p>
              </div>
              <button className="w-10 h-6 bg-surface-alt rounded-full relative border border-border transition-colors hover:bg-surface-hover">
                <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
