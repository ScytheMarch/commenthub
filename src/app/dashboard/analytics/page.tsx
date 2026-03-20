import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-text-secondary text-sm mt-1">
          Track engagement metrics across all your connected platforms
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-border p-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="h-7 w-7 text-purple-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Analytics Coming Soon</h2>
        <p className="text-text-secondary text-sm max-w-md mx-auto">
          We&apos;re building detailed analytics including reply rates, sentiment
          analysis, response time tracking, and engagement trends. Connect your
          accounts now so data starts flowing.
        </p>
      </div>
    </div>
  );
}
