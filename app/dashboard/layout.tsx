import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardSidebar from "@/features/dashboard/dashboard-sidebar";
import { getEdditorSessionsForUser } from "@/features/dashboard/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const edditorsessionData = await getEdditorSessionsForUser();

  const technologyIconMap: Record<string, string> = {
    REACT: "Zap",
    NEXTJS: "Lightbulb",
    EXPRESSS: "Database",
    REACT_NATIVE: "Phone",
    HONO: "flameIcon",
    VUE: "Compass",
    ANGULAR: "Terminal",
    SVELTE: "Svelte",
  };

  const formatttedEdditorSessionData =
    edditorsessionData.map((edditorsession) => ({
      id: edditorsession.id,
      name: edditorsession.title || "Untitled",
      starred: edditorsession.starmark?.[0]?.isMarked || false,
      icon: technologyIconMap[edditorsession.template] || "Code2",
    })) || [];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <DashboardSidebar
          initialDashboardSidebar={formatttedEdditorSessionData}
        />
        <main className="flex-1">{children}</main>
      </div>
    </SidebarProvider>
  );
}
