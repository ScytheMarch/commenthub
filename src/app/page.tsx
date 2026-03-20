import Link from "next/link";
import {
  MessageSquare,
  ArrowRight,
  Instagram,
  Youtube,
  Zap,
  Shield,
  BarChart3,
  Clock,
} from "lucide-react";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.18 8.18 0 004.76 1.52V6.84a4.84 4.84 0 01-1-.15z" />
    </svg>
  );
}

const features = [
  {
    icon: Zap,
    title: "Unified Inbox",
    description:
      "Every comment from every platform lands in one clean feed. No more app-switching.",
  },
  {
    icon: Clock,
    title: "Reply Instantly",
    description:
      "Respond to comments directly from CommentHub. Your reply posts back to the original platform.",
  },
  {
    icon: BarChart3,
    title: "Engagement Analytics",
    description:
      "Track reply rates, sentiment trends, and response times across all your accounts.",
  },
  {
    icon: Shield,
    title: "Never Miss a Comment",
    description:
      "Smart filters surface unanswered comments, questions, and high-engagement threads first.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-border sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-brand-600" />
            <span className="text-xl font-bold tracking-tight">
              CommentHub
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <Zap className="h-3.5 w-3.5" />
            Now supporting Instagram, TikTok, YouTube & Twitter
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-text-primary leading-[1.1] mb-6">
            All your social comments.
            <br />
            <span className="text-brand-600">One dashboard.</span>
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10">
            Stop juggling five apps to engage with your audience. CommentHub
            pulls every comment from every platform into a single, powerful
            inbox so you can reply faster and grow smarter.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-brand-600 text-white text-base font-semibold px-8 py-3.5 rounded-xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/25"
            >
              Start Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 text-base font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              See how it works
            </Link>
          </div>

          {/* Platform icons */}
          <div className="flex items-center justify-center gap-6 mt-14 text-text-muted">
            <Instagram className="h-7 w-7 hover:text-pink-500 transition-colors" />
            <TikTokIcon className="h-7 w-7 hover:text-cyan-400 transition-colors" />
            <Youtube className="h-7 w-7 hover:text-red-500 transition-colors" />
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-7 w-7 hover:text-sky-500 transition-colors"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border-2 border-border bg-surface-alt shadow-2xl shadow-black/5 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-surface border-b border-border">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-text-muted font-mono">
                app.commenthub.io/dashboard
              </span>
            </div>
            <div className="p-8 sm:p-12">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Unread Comments", value: "147", delta: "+23 today" },
                  { label: "Reply Rate", value: "89%", delta: "+5% this week" },
                  {
                    label: "Avg Response Time",
                    value: "12m",
                    delta: "-3m from last week",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl bg-white border border-border p-5"
                  >
                    <p className="text-sm text-text-muted">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-green-600 mt-1">{stat.delta}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {[
                  {
                    platform: "Instagram",
                    color: "bg-pink-500",
                    user: "@sarah_designs",
                    comment: "This is incredible! How did you make this?",
                    time: "2m ago",
                  },
                  {
                    platform: "TikTok",
                    color: "bg-cyan-400",
                    user: "@mike.creates",
                    comment: "Part 2 when?? We need the tutorial!",
                    time: "5m ago",
                  },
                  {
                    platform: "YouTube",
                    color: "bg-red-500",
                    user: "TechReviewer",
                    comment:
                      "Great breakdown. Would love to see a deep dive on the analytics side.",
                    time: "11m ago",
                  },
                ].map((item) => (
                  <div
                    key={item.user}
                    className="flex items-start gap-4 rounded-xl bg-white border border-border p-4"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 shrink-0 ${item.color}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">{item.user}</span>
                        <span className="text-text-muted">
                          on {item.platform}
                        </span>
                        <span className="text-text-muted ml-auto text-xs">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mt-1">
                        {item.comment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-surface-alt">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need to own your engagement
            </h2>
            <p className="text-text-secondary mt-4 max-w-xl mx-auto">
              Built for creators, brands, and agencies who take audience
              interaction seriously.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl bg-white border border-border p-8 hover:shadow-lg transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
            Ready to stop missing comments?
          </h2>
          <p className="text-text-secondary text-lg mb-10">
            Join thousands of creators who manage their engagement from one
            place. Free to start, scales with you.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-brand-600 text-white text-base font-semibold px-8 py-3.5 rounded-xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/25"
          >
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-text-muted text-sm">
            <MessageSquare className="h-4 w-4" />
            <span>&copy; {new Date().getFullYear()} CommentHub</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <a href="#" className="hover:text-text-primary transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-text-primary transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-text-primary transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
