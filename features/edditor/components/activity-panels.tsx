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
  Video,
  VideoOff,
  Minimize2,
  Maximize2,
  GripHorizontal,
  Wifi,
  WifiOff,
  Mic,
  MicOff,
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

// export function SearchPanel() {
//   return (
//     <div className="flex h-full w-64 flex-col border-r bg-background">
//       <div className="border-b p-4">
//         <h2 className="text-sm font-semibold mb-3">SEARCH</h2>
//         <Input placeholder="Search files..." className="h-8" />
//       </div>
//       <ScrollArea className="flex-1 p-4">
//         <p className="text-sm text-muted-foreground">No results found here </p>
//       </ScrollArea>
//     </div>
//   );
// }

interface SearchPanelProps {
  data: TemplateFolder;
  onFileSelect?: (file: any, line?: number) => void;
}

export function SearchPanel({ data, onFileSelect }: SearchPanelProps) {
  const [query, setQuery] = React.useState("");

  // flatten folder tree
  const getAllFiles = (folder: TemplateFolder): TemplateFile[] => {
    let files: TemplateFile[] = [];

    folder.items.forEach((item) => {
      if ("folderName" in item) {
        files = files.concat(getAllFiles(item));
      } else {
        files.push(item);
      }
    });

    return files;
  };

  const allFiles = React.useMemo(() => getAllFiles(data), [data]);

  const filteredFiles = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    return allFiles.filter((file) => {
      const fileName = `${file.filename}.${file.fileExtension}`.toLowerCase();
      const content = (file.content || "").toLowerCase();

      return fileName.includes(q) || content.includes(q);
    });
  }, [query, allFiles]);

  // get matched lines
  const getMatchedLines = (content: string, query: string) => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();
    return content
      .split("\n")
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.toLowerCase().includes(q))
      .slice(0, 5);
  };

  // highlight text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));

    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-yellow-300 text-black px-0.5 rounded">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* SEARCH */}
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold mb-3">SEARCH</h2>

        <Input
          placeholder="Search files or content..."
          className="h-8"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* RESULTS */}
      <ScrollArea className="flex-1 p-2">
        {query.trim() === "" ? (
          <p className="text-sm text-muted-foreground p-2">
            Type to search files and content
          </p>
        ) : filteredFiles.length === 0 ? (
          <p className="text-sm text-muted-foreground p-2">No results found</p>
        ) : (
          <div className="space-y-2">
            {filteredFiles.map((file, i) => {
              const fileName =
                `${file.filename}.${file.fileExtension}`.toLowerCase();

              const matchedLines = getMatchedLines(file.content || "", query);

              const firstMatchLine = matchedLines[0]?.index + 1;

              return (
                <div
                  key={i}
                  onClick={() => {
                    onFileSelect?.(file, firstMatchLine); // 🔥 SEND LINE NUMBER
                  }}
                  className="flex flex-col gap-1 p-2 rounded hover:bg-muted cursor-pointer"
                >
                  {/* FILE NAME */}
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    <span className="text-sm">
                      {file.filename}.{file.fileExtension}
                    </span>
                  </div>

                  {/* MATCHED LINES */}
                  {matchedLines.length > 0 && (
                    <div className="ml-6 mt-1 space-y-1">
                      {matchedLines.map((l) => (
                        <div
                          key={l.index}
                          className="text-[11px] font-mono text-muted-foreground"
                        >
                          <span className="text-gray-500 mr-2">
                            {l.index + 1}
                          </span>
                          {highlightText(l.line, query)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// export function SourceControlPanel() {
//   return (
//     <div className="flex h-full w-64 flex-col border-r bg-background">
//       <div className="border-b p-4">
//         <h2 className="text-sm font-semibold">SOURCE CONTROL</h2>
//       </div>
//       <ScrollArea className="flex-1 p-4">
//         <p className="text-sm text-muted-foreground">
//           No source control providers registered.
//         </p>
//       </ScrollArea>
//     </div>
//   );
// }

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession, signIn } from "next-auth/react";

interface Props {
  templateData: any;
  unsavedFiles?: Array<{
    id?: string;
    filename: string;
    fileExtension: string;
    content: string;
    hasUnsavedChanges?: boolean;
  }>;
}

export function SourceControlPanel({ templateData, unsavedFiles = [] }: Props) {
  const { data: session } = useSession();

  const [message, setMessage] = useState("");
  const [repo, setRepo] = useState("");
  const [newRepoName, setNewRepoName] = useState("");
  const [loading, setLoading] = useState(false);
  const [creatingRepo, setCreatingRepo] = useState(false);
  const [commitStatus, setCommitStatus] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const githubToken = (session as any)?.githubAccessToken;
  const isValidRepo = repo.includes("/");

  // 🔥 SUPER SAFE DEDUPLICATION (FINAL VERSION)
  const dedupeCommits = (list: any[]) => {
    const seen = new Set<string>();
    const result: any[] = [];

    for (const item of list || []) {
      if (!item) continue;

      // strongest unique key possible
      const key = item.sha || `${item.message || ""}-${item.date || ""}`;

      if (seen.has(key)) continue;

      seen.add(key);
      result.push(item);
    }

    return result;
  };

  // 📦 LOAD HISTORY (ROBUST API HANDLING)
  const loadHistory = useCallback(async () => {
    if (!githubToken || !isValidRepo) return;

    setLoadingHistory(true);

    try {
      const res = await fetch("/api/github/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: githubToken,
          repo,
        }),
      });

      const data = await res.json();

      console.log("📦 HISTORY RAW:", data);

      let commits: any[] = [];

      // handle all possible backend formats
      if (Array.isArray(data)) {
        commits = data;
      } else if (data?.success && Array.isArray(data.commits)) {
        commits = data.commits;
      }

      setHistory(dedupeCommits(commits));
    } catch (err) {
      console.error("History load failed:", err);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [githubToken, repo, isValidRepo]);

  // 🔄 AUTO LOAD HISTORY
  useEffect(() => {
    if (githubToken && isValidRepo) {
      loadHistory();
    }
  }, [githubToken, repo, isValidRepo, loadHistory]);

  // 🚀 COMMIT FILES
  const handleCommit = async () => {
    if (!message.trim() || !isValidRepo) return;

    setLoading(true);
    setCommitStatus("");

    try {
      const res = await fetch("/api/github/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          files: templateData,
          unsavedFiles,
          token: githubToken,
          repo,
        }),
      });

      const data = await res.json();

      console.log("✅ Commit result:", data);

      if (!res.ok || !data?.success) {
        const firstFailed = Array.isArray(data?.results)
          ? data.results.find((r: any) => r?.ok === false)
          : null;
        setCommitStatus(
          firstFailed?.error ||
            data?.fallbackReason ||
            data?.error ||
            data?.message ||
            "Commit failed. Check repo access and try again.",
        );
        return;
      }

      if (data?.fallback === "contents-api") {
        setCommitStatus(
          `Fallback commit: ${data.committedFiles} committed, ${data.skippedFiles || 0} skipped, ${data.failedFiles || 0} failed (out of ${data.totalFiles || "?"}).`,
        );
      } else {
        setCommitStatus("Commit pushed successfully.");
      }

      setMessage("");

      await loadHistory();
    } catch (err) {
      console.error("Commit failed:", err);
      setCommitStatus("Commit failed due to a network/server error.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRepo = async () => {
    if (!githubToken || !newRepoName.trim()) return;

    setCreatingRepo(true);
    setCommitStatus("");

    try {
      const res = await fetch("/api/github/create-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: githubToken,
          name: newRepoName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setCommitStatus(
          data?.error?.message ||
            data?.error ||
            data?.message ||
            "Failed to create repo.",
        );
        return;
      }

      if (data?.repo) {
        setRepo(data.repo);
      }
      setCommitStatus(
        `Repository created: ${data?.repo || newRepoName.trim()}`,
      );
      setNewRepoName("");
      await loadHistory();
    } catch (err) {
      console.error("Create repo failed:", err);
      setCommitStatus("Failed to create repo due to network/server error.");
    } finally {
      setCreatingRepo(false);
    }
  };

  const handleCreateRepoAndCommit = async () => {
    if (!repo.trim()) {
      if (!newRepoName.trim()) {
        setCommitStatus("Enter a new repository name first.");
        return;
      }
      await handleCreateRepo();
      return;
    }

    await handleCommit();
  };

  // 🔐 LOGIN STATE
  if (!githubToken) {
    return (
      <div className="flex h-full w-64 flex-col border-r bg-background p-4">
        <h2 className="text-sm font-semibold mb-4">SOURCE CONTROL</h2>

        <p className="text-sm text-muted-foreground mb-3">
          Connect GitHub to enable commits
        </p>

        <button
          onClick={() => signIn("github")}
          className="w-full bg-black text-white text-sm py-2 rounded"
        >
          Login with GitHub
        </button>
      </div>
    );
  }

  // 🔥 FINAL CLEAN HISTORY (MEMOIZED = NO UI GLITCHES)
  const cleanHistory = useMemo(() => {
    return dedupeCommits(history);
  }, [history]);

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* HEADER */}
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold">SOURCE CONTROL</h2>
      </div>

      {/* INPUTS */}
      <div className="p-3 border-b space-y-2">
        <input
          value={newRepoName}
          onChange={(e) => setNewRepoName(e.target.value)}
          placeholder="new repository name"
          className="w-full text-sm border rounded px-2 py-1"
        />
        <button
          onClick={handleCreateRepo}
          disabled={creatingRepo || !newRepoName.trim()}
          className="w-full bg-blue-600 text-white text-sm py-1 rounded disabled:opacity-50"
        >
          {creatingRepo ? "Creating Repo..." : "Create Repo"}
        </button>

        <input
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="username/repository"
          className="w-full text-sm border rounded px-2 py-1"
        />

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Commit message..."
          className="w-full text-sm border rounded px-2 py-1"
        />

        <button
          onClick={handleCommit}
          disabled={loading}
          className="w-full bg-green-600 text-white text-sm py-1 rounded disabled:opacity-50"
        >
          {loading ? "Committing..." : "Commit All Files"}
        </button>
        <button
          onClick={handleCreateRepoAndCommit}
          disabled={
            loading || creatingRepo || (!repo.trim() && !newRepoName.trim())
          }
          className="w-full bg-emerald-700 text-white text-sm py-1 rounded disabled:opacity-50"
        >
          {loading || creatingRepo
            ? "Working..."
            : repo.trim()
              ? "Commit Now"
              : "Create Repo + Commit"}
        </button>
        {commitStatus ? (
          <p className="text-xs text-muted-foreground">{commitStatus}</p>
        ) : null}
      </div>

      {/* HISTORY */}
      <div className="flex-1 overflow-y-auto p-3">
        <h3 className="text-xs font-semibold mb-2 text-muted-foreground">
          Commit History
        </h3>

        {!isValidRepo ? (
          <p className="text-sm text-muted-foreground">
            Enter repo like: owner/repo
          </p>
        ) : loadingHistory ? (
          <p className="text-sm text-muted-foreground">Loading history...</p>
        ) : cleanHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">No commits found</p>
        ) : (
          cleanHistory.map((item: any) => (
            <div key={item.sha} className="mb-2 border rounded p-2 text-xs">
              <div className="font-medium">{item.message}</div>
              <div className="text-muted-foreground">{item.author}</div>
              <div className="text-[10px] opacity-60">
                {item.date ? new Date(item.date).toLocaleString() : ""}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
// export function DebugPanel() {
//   return (
//     <div className="flex h-full w-64 flex-col border-r bg-background">
//       <div className="border-b p-4">
//         <h2 className="text-sm font-semibold">RUN AND DEBUG</h2>
//       </div>
//       <ScrollArea className="flex-1 p-4">
//         <p className="text-sm text-muted-foreground">
//           To customize Run and Debug, create a launch.json file.
//         </p>
//       </ScrollArea>
//     </div>
//   );
// }

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
  isCollaborationActive: boolean;
  onToggleCollaboration: () => void;
  onLogActivity?: (type: string, meta?: Record<string, string>) => Promise<void>;
  bindClientEvent?: <T,>(
    eventName: string,
    handler: (data: T) => void,
  ) => () => void;
  triggerClientEvent?: (eventName: string, data: unknown) => boolean;
}

export function CollaborationPanel({
  sessionId,
  activeUsers,
  messages,
  isConnected,
  currentUserId,
  sendMessage,
  isCollaborationActive,
  onToggleCollaboration,
  onLogActivity,
  bindClientEvent,
  triggerClientEvent,
}: CollaborationPanelProps) {
  const [input, setInput] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [callMode, setCallMode] = React.useState<"none" | "voice" | "video">(
    "none",
  );
  const [callStartedAt, setCallStartedAt] = React.useState<number | null>(null);
  const [callElapsedSec, setCallElapsedSec] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [isVideoBoxMinimized, setIsVideoBoxMinimized] = React.useState(false);
  const [videoBoxPosition, setVideoBoxPosition] = React.useState({
    x: 0,
    y: 0,
  });
  const [videoBoxPositionInitialized, setVideoBoxPositionInitialized] =
    React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const localVideoRef = React.useRef<HTMLVideoElement>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement>(null);
  const remoteAudioRef = React.useRef<HTMLAudioElement>(null);
  const localStreamRef = React.useRef<MediaStream | null>(null);
  const peerConnectionsRef = React.useRef<Map<string, RTCPeerConnection>>(
    new Map(),
  );
  const [remoteStream, setRemoteStream] = React.useState<MediaStream | null>(
    null,
  );
  const dragStateRef = React.useRef({
    dragging: false,
    offsetX: 0,
    offsetY: 0,
  });

  // Auto-scroll chat to bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/editor/${sessionId}?collab=1`
      : "";

  const formatDuration = React.useCallback((totalSec: number) => {
    const sec = Math.max(0, Math.floor(totalSec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const two = (n: number) => String(n).padStart(2, "0");
    return h > 0 ? `${two(h)}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`;
  }, []);

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

  const getMedia = React.useCallback(async (mode: "voice" | "video") => {
    const constraints =
      mode === "video"
        ? { audio: true, video: true }
        : { audio: true, video: false };
    return navigator.mediaDevices.getUserMedia(constraints);
  }, []);

  const cleanupCall = React.useCallback(() => {
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setRemoteStream(null);
    setIsMuted(false);
    setCallStartedAt(null);
    setCallElapsedSec(0);
  }, []);

  const createPeerConnection = React.useCallback(
    (targetUserId: string, mode: "voice" | "video", stream: MediaStream) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      stream.getTracks().forEach((track) => {
        if (mode === "voice" && track.kind === "video") return;
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        const [incomingStream] = event.streams;
        if (incomingStream) {
          setRemoteStream(incomingStream);
        }
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        triggerClientEvent?.("client-webrtc-ice", {
          to: targetUserId,
          from: currentUserId,
          candidate: event.candidate,
        });
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected" ||
          pc.connectionState === "closed"
        ) {
          peerConnectionsRef.current.delete(targetUserId);
        }
      };

      peerConnectionsRef.current.set(targetUserId, pc);
      return pc;
    },
    [currentUserId, triggerClientEvent],
  );

  const startCall = React.useCallback(
    async (mode: "voice" | "video") => {
      if (!isCollaborationActive) return;
      try {
        cleanupCall();
        const stream = await getMedia(mode);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch {
        alert("Please allow microphone/camera permissions.");
        return;
      }
      setCallMode(mode);
      const now = Date.now();
      setCallStartedAt(now);
      setCallElapsedSec(0);
      void onLogActivity?.(`${mode}_call_joined`);
    },
    [cleanupCall, getMedia, isCollaborationActive, onLogActivity],
  );

  // Optional: allow invite links like `...?collab=1&call=voice|video` to auto-start a call.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isCollaborationActive) return;
    if (callMode !== "none") return;
    const params = new URLSearchParams(window.location.search);
    const call = params.get("call");
    if (call === "voice" || call === "video") {
      void startCall(call);
    }
  }, [callMode, isCollaborationActive, startCall]);

  const endCall = React.useCallback(() => {
    cleanupCall();
    triggerClientEvent?.("client-webrtc-ended", { from: currentUserId });
    if (callMode === "voice") {
      void onLogActivity?.("voice_call_left");
    }
    if (callMode === "video") {
      void onLogActivity?.("video_call_left");
    }
    setCallMode("none");
  }, [callMode, cleanupCall, currentUserId, onLogActivity]);

  // Call duration timer
  React.useEffect(() => {
    if (callMode === "none" || !callStartedAt) return;
    const id = window.setInterval(() => {
      setCallElapsedSec(Math.floor((Date.now() - callStartedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [callMode, callStartedAt]);

  const toggleMute = React.useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextMuted = !isMuted;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
  }, [isMuted]);

  React.useEffect(() => {
    if (!isCollaborationActive) {
      endCall();
    }
  }, [isCollaborationActive, endCall]);

  React.useEffect(() => {
    if (!isCollaborationActive || !currentUserId || !bindClientEvent) return;

    const offOffer = bindClientEvent<{
      to: string;
      from: string;
      sdp: RTCSessionDescriptionInit;
      mode: "voice" | "video";
    }>("client-webrtc-offer", async (data) => {
      if (data.to !== currentUserId || data.from === currentUserId) return;
      if (!localStreamRef.current) {
        const stream = await getMedia(data.mode);
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setCallMode(data.mode);
      }

      const pc = createPeerConnection(
        data.from,
        data.mode,
        localStreamRef.current!,
      );
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      triggerClientEvent?.("client-webrtc-answer", {
        to: data.from,
        from: currentUserId,
        sdp: answer,
      });
    });

    const offAnswer = bindClientEvent<{
      to: string;
      from: string;
      sdp: RTCSessionDescriptionInit;
    }>("client-webrtc-answer", async (data) => {
      if (data.to !== currentUserId) return;
      const pc = peerConnectionsRef.current.get(data.from);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    });

    const offIce = bindClientEvent<{
      to: string;
      from: string;
      candidate: RTCIceCandidateInit;
    }>("client-webrtc-ice", async (data) => {
      if (data.to !== currentUserId) return;
      const pc = peerConnectionsRef.current.get(data.from);
      if (!pc) return;
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    });

    const offEnded = bindClientEvent<{ from: string }>(
      "client-webrtc-ended",
      () => {
        cleanupCall();
        setCallMode("none");
      },
    );

    return () => {
      offOffer();
      offAnswer();
      offIce();
      offEnded();
    };
  }, [
    bindClientEvent,
    cleanupCall,
    createPeerConnection,
    currentUserId,
    getMedia,
    isCollaborationActive,
    triggerClientEvent,
  ]);

  React.useEffect(() => {
    if (!isCollaborationActive || callMode === "none" || !localStreamRef.current) {
      return;
    }

    activeUsers
      .filter((u) => u.id !== currentUserId)
      .forEach(async (user) => {
        if (peerConnectionsRef.current.has(user.id)) return;
        const pc = createPeerConnection(user.id, callMode, localStreamRef.current!);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        triggerClientEvent?.("client-webrtc-offer", {
          to: user.id,
          from: currentUserId,
          sdp: offer,
          mode: callMode,
        });
      });
  }, [
    activeUsers,
    callMode,
    createPeerConnection,
    currentUserId,
    isCollaborationActive,
    triggerClientEvent,
  ]);

  React.useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      // Autoplay is sometimes blocked; attempt play after user gesture (Join click)
      // and also when remote stream becomes available.
      remoteAudioRef.current.muted = false;
      void remoteAudioRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  React.useEffect(() => {
    // Ensure local stream attaches even if the <video> mounts later (floating box).
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [callMode]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (callMode !== "video" || videoBoxPositionInitialized) return;

    setVideoBoxPosition({
      x: Math.max(16, window.innerWidth - 304),
      y: Math.max(16, window.innerHeight - 220),
    });
    setVideoBoxPositionInitialized(true);
  }, [callMode, videoBoxPositionInitialized]);

  const handleVideoBoxMouseMove = React.useCallback((event: MouseEvent) => {
    if (!dragStateRef.current.dragging) return;

    const nextX = Math.max(8, event.clientX - dragStateRef.current.offsetX);
    const nextY = Math.max(8, event.clientY - dragStateRef.current.offsetY);
    setVideoBoxPosition({ x: nextX, y: nextY });
  }, []);

  const stopVideoBoxDragging = React.useCallback(() => {
    dragStateRef.current.dragging = false;
    window.removeEventListener("mousemove", handleVideoBoxMouseMove);
    window.removeEventListener("mouseup", stopVideoBoxDragging);
  }, [handleVideoBoxMouseMove]);

  const startVideoBoxDragging = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      dragStateRef.current.dragging = true;
      dragStateRef.current.offsetX = event.clientX - videoBoxPosition.x;
      dragStateRef.current.offsetY = event.clientY - videoBoxPosition.y;

      window.addEventListener("mousemove", handleVideoBoxMouseMove);
      window.addEventListener("mouseup", stopVideoBoxDragging);
    },
    [handleVideoBoxMouseMove, stopVideoBoxDragging, videoBoxPosition.x, videoBoxPosition.y],
  );

  React.useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleVideoBoxMouseMove);
      window.removeEventListener("mouseup", stopVideoBoxDragging);
      cleanupCall();
    };
  }, [cleanupCall, handleVideoBoxMouseMove, stopVideoBoxDragging]);

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
            variant={isConnected && isCollaborationActive ? "default" : "outline"}
            className="text-[10px] px-1.5 py-0 h-4"
          >
            {isConnected && isCollaborationActive ? (
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
        <Button
          size="sm"
          variant={isCollaborationActive ? "destructive" : "default"}
          className="w-full h-7 text-xs mt-2"
          onClick={onToggleCollaboration}
        >
          {isCollaborationActive
            ? "Stop Collaboration"
            : "Start Collaboration Session"}
        </Button>
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

          {isCollaborationActive && (
            <>
              {/* Voice Call */}
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1.5">
                  Voice Call
                </p>
                <Button
                  size="sm"
                  variant={callMode === "voice" ? "destructive" : "outline"}
                  className="w-full h-7 text-xs gap-1.5"
                  disabled={callMode === "video"}
                  onClick={() =>
                    callMode === "voice" ? endCall() : startCall("voice")
                  }
                >
                  {callMode === "voice" ? (
                    <>
                      <PhoneOff className="h-3.5 w-3.5" /> Leave Voice Call
                    </>
                  ) : (
                    <>
                      <Phone className="h-3.5 w-3.5" /> Join Voice Call
                    </>
                  )}
                </Button>
                {callMode === "voice" && (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      {formatDuration(callElapsedSec)}
                    </span>
                    <Button
                      size="sm"
                      variant={isMuted ? "destructive" : "outline"}
                      className="h-7 text-xs gap-1.5"
                      onClick={toggleMute}
                      disabled={!localStreamRef.current}
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? (
                        <>
                          <MicOff className="h-3.5 w-3.5" /> Muted
                        </>
                      ) : (
                        <>
                          <Mic className="h-3.5 w-3.5" /> Mute
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Video Call */}
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1.5">
                  Video Call
                </p>
                <Button
                  size="sm"
                  variant={callMode === "video" ? "destructive" : "outline"}
                  className="w-full h-7 text-xs gap-1.5"
                  disabled={callMode === "voice"}
                  onClick={() =>
                    callMode === "video" ? endCall() : startCall("video")
                  }
                >
                  {callMode === "video" ? (
                    <>
                      <VideoOff className="h-3.5 w-3.5" /> Leave Video Call
                    </>
                  ) : (
                    <>
                      <Video className="h-3.5 w-3.5" /> Join Video Call
                    </>
                  )}
                </Button>
              </div>

              <Separator />
            </>
          )}

          {isCollaborationActive ? (
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
          ) : (
            <p className="text-xs text-muted-foreground">
              Start collaboration session to enable chat.
            </p>
          )}
        </div>
      </ScrollArea>

      {isCollaborationActive && (
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
      )}

      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Floating mini video box */}
      {isCollaborationActive && callMode === "video" && (
        <div
          className="fixed z-50 w-72 rounded-lg border bg-background shadow-xl"
          style={{ left: videoBoxPosition.x, top: videoBoxPosition.y }}
        >
          <div
            className="flex items-center justify-between border-b px-3 py-2 cursor-move select-none"
            onMouseDown={startVideoBoxDragging}
          >
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              Video Call Active
            </p>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setIsVideoBoxMinimized((prev) => !prev)}
                title={isVideoBoxMinimized ? "Restore" : "Minimize"}
              >
                {isVideoBoxMinimized ? (
                  <Maximize2 className="h-3.5 w-3.5" />
                ) : (
                  <Minimize2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>

          {!isVideoBoxMinimized && (
            <div className="p-0">
              <div className="h-44 w-full bg-black rounded-b-lg overflow-hidden">
                <div className="grid h-full w-full grid-cols-2 gap-1 bg-black p-1">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full rounded object-cover"
                  />
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="h-full w-full rounded object-cover"
                  />
                </div>
              </div>
              <div className="p-2">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] text-muted-foreground">
                    {formatDuration(callElapsedSec)}
                  </span>
                  <Button
                    size="sm"
                    variant={isMuted ? "destructive" : "outline"}
                    className="h-7 text-xs gap-1.5"
                    onClick={toggleMute}
                    disabled={!localStreamRef.current}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <>
                        <MicOff className="h-3.5 w-3.5" /> Muted
                      </>
                    ) : (
                      <>
                        <Mic className="h-3.5 w-3.5" /> Mute
                      </>
                    )}
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs w-full"
                  onClick={endCall}
                >
                  End Video Call
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
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
