"use client";

import * as React from "react";
import {
  Search,
  Users,
  Plus,
  FilePlus,
  FolderPlus,
  ChevronRight,
  Folder,
  File,
  MoreHorizontal,
  Trash2,
  Edit3,
  Copy,
  Check,
  Send,
  Phone,
  PhoneOff,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import TemplateNode from "./template-node";
import { TemplateFile, TemplateFolder } from "../lib/path-to-jason";
import type { CollabUser, ChatMessage } from "../hook/useCollaboration";

interface ExplorerPanelProps {
  data: TemplateFolder;
  onFileSelect?: (file: TemplateFile) => void;
  selectedFile?: TemplateFile;
  onAddFile?: (file: TemplateFile, parentPath: string) => void;
  onAddFolder?: (folder: TemplateFolder, parentPath: string) => void;
  onDeleteFile?: (file: TemplateFile, parentPath: string) => void;
  onDeleteFolder?: (folder: TemplateFolder, parentPath: string) => void;
  onRenameFile?: (
    file: TemplateFile,
    newFilename: string,
    newExtension: string,
    parentPath: string,
  ) => void;
  onRenameFolder?: (
    folder: TemplateFolder,
    newFolderName: string,
    parentPath: string,
  ) => void;
}

export function ExplorerPanel({
  data,
  onFileSelect,
  selectedFile,
  onAddFile,
  onAddFolder,
  onDeleteFile,
  onDeleteFolder,
  onRenameFile,
  onRenameFolder,
}: ExplorerPanelProps) {
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = React.useState(false);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] =
    React.useState(false);
  const [newFileName, setNewFileName] = React.useState("");
  const [newFileExtension, setNewFileExtension] = React.useState("js");
  const [newFolderName, setNewFolderName] = React.useState("");

  const handleAddRootFile = () => {
    setIsNewFileDialogOpen(true);
  };

  const handleAddRootFolder = () => {
    setIsNewFolderDialogOpen(true);
  };

  const handleCreateFile = () => {
    if (onAddFile && newFileName.trim()) {
      const newFile: TemplateFile = {
        filename: newFileName.trim(),
        fileExtension: newFileExtension.trim() || "js",
        content: "",
      };
      onAddFile(newFile, "");
      setNewFileName("");
      setNewFileExtension("js");
      setIsNewFileDialogOpen(false);
    }
  };

  const handleCreateFolder = () => {
    if (onAddFolder && newFolderName.trim()) {
      const newFolder: TemplateFolder = {
        folderName: newFolderName.trim(),
        items: [],
      };
      onAddFolder(newFolder, "");
      setNewFolderName("");
      setIsNewFolderDialogOpen(false);
    }
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="border-b p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase">Explorer</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleAddRootFile}>
                <FilePlus className="mr-2 h-4 w-4" />
                New File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddRootFolder}>
                <FolderPlus className="mr-2 h-4 w-4" />
                New Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {data && data.items && data.items.length > 0 ? (
            data.items.map((child, index) => (
              <TemplateNode
                key={index}
                item={child}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
                level={0}
                path=""
                onAddFile={onAddFile}
                onAddFolder={onAddFolder}
                onDeleteFile={onDeleteFile}
                onDeleteFolder={onDeleteFolder}
                onRenameFile={onRenameFile}
                onRenameFolder={onRenameFolder}
              />
            ))
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No files yet</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* New File Dialog */}
      {isNewFileDialogOpen && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-background border rounded-lg p-4 w-80 shadow-lg">
            <h3 className="text-sm font-semibold mb-3">Create New File</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">
                  Filename
                </label>
                <Input
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="index"
                  className="h-8"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Extension
                </label>
                <Input
                  value={newFileExtension}
                  onChange={(e) => setNewFileExtension(e.target.value)}
                  placeholder="js"
                  className="h-8"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsNewFileDialogOpen(false);
                    setNewFileName("");
                    setNewFileExtension("js");
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreateFile}>
                  Create
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Dialog */}
      {isNewFolderDialogOpen && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-background border rounded-lg p-4 w-80 shadow-lg">
            <h3 className="text-sm font-semibold mb-3">Create New Folder</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">
                  Folder Name
                </label>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="my-folder"
                  className="h-8"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsNewFolderDialogOpen(false);
                    setNewFolderName("");
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreateFolder}>
                  Create
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SearchPanel() {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold mb-3">SEARCH</h2>
        <Input placeholder="Search files..." className="h-8" />
      </div>
      <ScrollArea className="flex-1 p-4">
        <p className="text-sm text-muted-foreground">No results found here </p>
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

export interface CollaborationPanelProps {
  sessionId: string;
  activeUsers: CollabUser[];
  messages: ChatMessage[];
  isConnected: boolean;
  currentUserId: string;
  sendMessage: (content: string) => Promise<void>;
}

export function CollaborationPanel({
  sessionId,
  activeUsers,
  messages,
  isConnected,
  currentUserId,
  sendMessage,
}: CollaborationPanelProps) {
  const [input, setInput] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [voiceOpen, setVoiceOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/editor/${sessionId}`
      : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    await sendMessage(input.trim());
    setInput("");
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  function getInitials(name: string | null): string {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Header */}
      <div className="border-b p-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xs font-semibold uppercase flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Collaboration
          </h2>
          <Badge
            variant={isConnected ? "default" : "outline"}
            className="text-[10px] px-1.5 py-0 h-4"
          >
            {isConnected ? (
              <span className="flex items-center gap-1">
                <Wifi className="h-2.5 w-2.5" /> Live
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <WifiOff className="h-2.5 w-2.5" /> Off
              </span>
            )}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Invite Link */}
          <div>
            <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1.5">
              Invite Link
            </p>
            <div className="flex items-center gap-1">
              <input
                readOnly
                value={inviteUrl}
                className="flex-1 min-w-0 h-7 rounded border bg-muted px-2 text-[10px] truncate"
              />
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7 shrink-0"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Active Users */}
          <div>
            <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">
              Active Users ({activeUsers.length})
            </p>
            {activeUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No one else here yet
              </p>
            ) : (
              <div className="space-y-1.5">
                {activeUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-2">
                    <div className="relative">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.image ?? undefined} />
                        <AvatarFallback
                          className="text-[9px]"
                          style={{ backgroundColor: user.color }}
                        >
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background bg-green-500" />
                    </div>
                    <span className="text-xs truncate max-w-[140px]">
                      {user.id === currentUserId
                        ? `${user.name} (you)`
                        : user.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Voice Call */}
          <div>
            <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1.5">
              Voice Call
            </p>
            <Button
              size="sm"
              variant={voiceOpen ? "destructive" : "outline"}
              className="w-full h-7 text-xs gap-1.5"
              onClick={() => setVoiceOpen((v) => !v)}
            >
              {voiceOpen ? (
                <>
                  <PhoneOff className="h-3.5 w-3.5" /> Leave Call
                </>
              ) : (
                <>
                  <Phone className="h-3.5 w-3.5" /> Join Voice Call
                </>
              )}
            </Button>
            {voiceOpen && (
              <div className="mt-2 rounded-md overflow-hidden border h-48">
                <iframe
                  allow="camera; microphone; fullscreen; display-capture"
                  src={`https://meet.jit.si/null-ide-${sessionId}#config.startWithVideoMuted=true&config.prejoinPageEnabled=false&config.toolbarButtons=["microphone","hangup"]`}
                  className="w-full h-full"
                  title="Voice Call"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Chat */}
          <div>
            <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">
              Chat
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No messages yet. Say hi!
                </p>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.userId === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}
                    >
                      {!isOwn && (
                        <span className="text-[10px] text-muted-foreground px-1">
                          {msg.userName ?? "Anonymous"}
                        </span>
                      )}
                      <div
                        className={`max-w-[180px] rounded-lg px-2.5 py-1.5 text-xs overflow-hidden ${
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-muted-foreground px-1">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <div className="border-t p-2 flex gap-1.5">
        <Input
          className="h-7 text-xs"
          placeholder="Message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!isConnected || sending}
        />
        <Button
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={handleSend}
          disabled={!input.trim() || !isConnected || sending}
        >
          <Send className="h-3 w-3" />
        </Button>
      </div>
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
