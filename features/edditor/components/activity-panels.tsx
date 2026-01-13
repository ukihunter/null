"use client";

import * as React from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SearchPanel() {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold mb-3">SEARCH</h2>
        <Input placeholder="Search files..." className="h-8" />
      </div>
      <ScrollArea className="flex-1 p-4">
        <p className="text-sm text-muted-foreground">No results</p>
      </ScrollArea>
    </div>
  );
}

export function SourceControlPanel() {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold">SOURCE CONTROL</h2>
      </div>
      <ScrollArea className="flex-1 p-4">
        <p className="text-sm text-muted-foreground">
          No source control providers registered.
        </p>
      </ScrollArea>
    </div>
  );
}

export function DebugPanel() {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold">RUN AND DEBUG</h2>
      </div>
      <ScrollArea className="flex-1 p-4">
        <p className="text-sm text-muted-foreground">
          To customize Run and Debug, create a launch.json file.
        </p>
      </ScrollArea>
    </div>
  );
}

export function ExtensionsPanel() {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold mb-3">EXTENSIONS</h2>
        <Input placeholder="Search extensions..." className="h-8" />
      </div>
      <ScrollArea className="flex-1 p-4">
        <p className="text-sm text-muted-foreground">
          No extensions installed.
        </p>
      </ScrollArea>
    </div>
  );
}

export function CollaborationPanel() {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />
          COLLABORATION
        </h2>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Active Users</h3>
            <p className="text-sm text-muted-foreground">
              No active collaborators
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Share Session</h3>
            <p className="text-xs text-muted-foreground">
              Start a collaboration session to invite others
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export function AccountPanel() {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold">ACCOUNT</h2>
      </div>
      <ScrollArea className="flex-1 p-4">
        <p className="text-sm text-muted-foreground">
          Sign in to sync settings and access features.
        </p>
      </ScrollArea>
    </div>
  );
}

export function SettingsPanel() {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold">SETTINGS</h2>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Editor Settings</p>
          <p className="text-xs text-muted-foreground">
            Configure your editor preferences
          </p>
        </div>
      </ScrollArea>
    </div>
  );
}
