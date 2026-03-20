import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen flex bg-surface-alt">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={session.user} />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
