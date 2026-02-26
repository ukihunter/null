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
import { useParams } from "next/navigation";
import TemplateNode from "./template-node";
import { TemplateFile, TemplateFolder } from "../lib/path-to-jason";
import CollaborationSessionButtons from "@/features/collaboration/collboration";

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
  const params = useParams();
  const edditorSessionId = params?.id as string;

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />
          COLLABORATION
        </h2>
      </div>
      <ScrollArea className="flex-1 p-4">
        <CollaborationSessionButtons edditorSessionId={edditorSessionId} />
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
