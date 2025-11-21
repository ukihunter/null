"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Code2,
  Compass,
  FlameIcon,
  FolderPlus,
  Home,
  Icon,
  Lightbulb,
  LucideIcon,
  Plus,
  Settings,
  Sidebar as SidebarIcon,
  Star,
  Terminal,
  Zap,
  History,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import UserButton from "@/features/dashboard/components/sidebar-user-button";

interface DashboardSidebarProps {
  id: string;
  name: string;
  icon: string;
  starred: boolean;
}

const lucideIconMap: Record<string, LucideIcon> = {
  Zap: Zap,
  Lightbulb: Lightbulb,
  Compass: Compass,
  FlameIcon: FlameIcon,
  Terminal: Terminal,
  Code2: Code2,
};

const DashboardSidebar: React.FC<{
  initialDashboardSidebar: DashboardSidebarProps[];
}> = ({ initialDashboardSidebar }) => {
  const pathname = usePathname();
  const [starredDashboards, setStarredDashboards] = useState(
    initialDashboardSidebar.filter((p) => p.starred)
  );
  const [recentActivity, setRecentActivity] = useState(initialDashboardSidebar);

  return (
    <Sidebar variant="inset" collapsible="icon" className="border border-r">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-3 justify-center">
          <Image src={"/null.svg"} width={60} height={60} alt="Logo" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/"}
                tooltip={"Home"}
              >
                <Link href={"/"}>
                  <Home className="size-4" />
                  <span>Home</span>
                </Link>
              </SidebarMenuButton>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard"}
                tooltip={"Dashboard"}
              >
                <Link href={"#"}>
                  <LayoutDashboard className="size-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            <Star className="size-4 mr-2" />
            Starred
          </SidebarGroupLabel>
          <SidebarGroupAction title="add Starred project">
            <Plus className="size-4" />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {starredDashboards.length === 0 && recentActivity.length === 0 ? (
                <div className="text-center text-muted-foreground py-4 w-full">
                  Create Your Project
                </div>
              ) : (
                starredDashboards.map((dashboard) => {
                  // Move the const inside the function body
                  const IconComponent = lucideIconMap[dashboard.icon] || Code2;

                  return (
                    <SidebarMenuItem key={dashboard.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === `/editor/${dashboard.id}`}
                        tooltip={dashboard.name}
                      >
                        <Link
                          href={`/editor/${dashboard.id}`}
                          className="flex items-center gap-2"
                        >
                          {IconComponent && (
                            <IconComponent className="w-4 h-4" />
                          )}
                          <span>{dashboard.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>
            <History className="h-4 w-4 mr-2" />
            Recent
          </SidebarGroupLabel>
          <SidebarGroupAction title="Create new Project">
            <FolderPlus className="h-4 w-4" />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {starredDashboards.length === 0 && recentActivity.length === 0
                ? null
                : recentActivity.map((activity) => {
                    const IconComponent = lucideIconMap[activity.icon] || Code2;
                    return (
                      <SidebarMenuItem key={activity.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === `/edditor/${activity.id}`}
                          tooltip={activity.name}
                        >
                          <Link href={`/edditor/${activity.id}`}>
                            {IconComponent && (
                              <IconComponent className="h-4 w-4" />
                            )}
                            <span>{activity.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="View all">
                  <Link href="/editors" className="flex flex-col items-start">
                    <span className="text-sm text-muted-foreground">
                      View all Project
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton className="mt-2" asChild tooltip="User Menu">
              <UserButton />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};

export default DashboardSidebar;
