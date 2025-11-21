"use client";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Bell,
  ChevronDown,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  User,
  Verified,
} from "lucide-react";
import LogoutButton from "@/features/auth/components/logout-button";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";

const UserButton = () => {
  const user = useCurrentUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 w-full  py-2 rounded-md hover:bg-accent transition text-left">
          {/* Avatar */}
          <Avatar className="h-10 w-10 rounded-full">
            <AvatarImage
              src={user?.image ?? undefined}
              alt={user?.name ?? "User"}
            />
            <AvatarFallback className="bg-orange-500 text-white">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>

          {/* Name + Email */}
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="text-sm font-bold truncate">{user?.name}</span>
            <span className="text-xs text-muted-foreground font-semibold truncate">
              {user?.email}
            </span>
          </div>

          {/* Chevron */}
          <ChevronsUpDown className="ml-auto font-bold" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="ml-64 w-56" align="end" side="bottom">
        <DropdownMenuItem>
          <Avatar className="h-7 w-7 rounded-full">
            <AvatarImage
              src={user?.image ?? undefined}
              alt={user?.name ?? "User"}
            />
            <AvatarFallback className="bg-orange-500 text-white">
              <User className="h-20 w-20" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col leading-tight  overflow-hidden">
            <span className="font-bold">{user?.name}</span>
            <span className="text-[10px]">{user?.email}</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <Sparkles className="h-4 w-4 mr-2 text-muted-foreground" />
          <div className="font-semibold">Upgrade Plan</div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Verified className="h-4 w-4 mr-2 text-muted-foreground" />
          <div className="font-semibold">Account</div>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
          <div className="font-semibold">Billing</div>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Bell className="h-4 w-4 mr-2 text-muted-foreground" />
          <div className="font-semibold">Notifications</div>
        </DropdownMenuItem>

        <LogoutButton>
          <DropdownMenuItem>
            <LogOut className="h-4 w-4 mr-2" />
            LogOut
          </DropdownMenuItem>
        </LogoutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
