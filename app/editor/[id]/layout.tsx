import { SidebarProvider } from "@/components/ui/sidebar";
import { CollaborationProvider } from "@/features/collaboration/CollaborationContext";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <CollaborationProvider>{children}</CollaborationProvider>
    </SidebarProvider>
  );
}
