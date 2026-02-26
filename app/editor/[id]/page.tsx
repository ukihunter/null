"use client";

import React, { use, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useEditor } from "@/features/edditor/hook/useEditor";
import TemplateFileTree from "@/features/edditor/components/template-file-tree";
import { useFileExplorer } from "@/features/edditor/hook/useFileExpolrer";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  FileText,
  AlertCircle,
  Save,
  X,
  Settings,
  BookmarkPlus,
  BotIcon,
  Files,
  Search,
  GitBranch,
  Play,
  Package,
  User,
  Users,
} from "lucide-react";
import {
  ActivityBar,
  ActivityBarItem,
  ActivityBarProvider,
  ActivityBarSeparator,
  ActivityBarSpacer,
} from "@/components/ui/activity-bar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import {
  TemplateFile,
  TemplateFolder,
} from "@/features/edditor/lib/path-to-jason";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import CodeEditor from "@/features/edditor/components/Code-editor";
import { useWebContainer } from "@/features/webContaniers/hooks/useWebContaoner";
import WebContainerPreview from "@/features/webContaniers/components/webContainer-priview";

import LoadingStep from "@/components/ui/loader";
import { toast } from "sonner";
import { findFilePath } from "@/features/edditor/lib";
import {
  SearchPanel,
  SourceControlPanel,
  DebugPanel,
  ExtensionsPanel,
  CollaborationPanel,
  AccountPanel,
  SettingsPanel,
  ExplorerPanel,
} from "@/features/edditor/components/activity-panels";
import ToggelAI from "@/features/edditor/components/toggel-ai";
import { useAISuggestion } from "@/features/ai-chat/hooks/useAiSuggesion";
import { editor } from "monaco-editor";
import { useCollaborationContext } from "@/features/collaboration/CollaborationContext";
//import { error } from "console";

const Page = () => {
  const { id } = useParams() as { id?: string };
  const { editorData, templateData, error, isLoading, saveTemplateData } =
    useEditor(id ?? "");

  const aiSuggestion = useAISuggestion();

  const { activeSessionKey, bindEditorToYjs } = useCollaborationContext();
  const collabEditorRef = useRef<any>(null);
  const collabUnbindRef = useRef<(() => void) | null>(null);

  const {
    activeFileId,
    closeAllFiles,
    openFile,
    closeFile,
    openFiles,
    setActiveFileId,
    setTemplateData,
    updateFileContent,
    setOpenFiles,
    handleAddFile,
    handleAddFolder,
    handleDeleteFile,
    handleDeleteFolder,
    handleRenameFile,
    handleRenameFolder,
  } = useFileExplorer();

  // Re-bind the editor to Yjs whenever the active file or session changes
  useEffect(() => {
    if (collabUnbindRef.current) {
      collabUnbindRef.current();
      collabUnbindRef.current = null;
    }
    if (activeSessionKey && collabEditorRef.current && activeFileId) {
      collabUnbindRef.current = bindEditorToYjs(
        collabEditorRef.current,
        activeFileId,
      );
    }
  }, [activeSessionKey, activeFileId, bindEditorToYjs]);

  const handleEditorMount = useCallback(
    (editor: any) => {
      collabEditorRef.current = editor;
      if (activeSessionKey && activeFileId) {
        if (collabUnbindRef.current) collabUnbindRef.current();
        collabUnbindRef.current = bindEditorToYjs(editor, activeFileId);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeSessionKey, activeFileId],
  );

  const {
    serverUrl,
    isLoading: containerLoading,
    error: containerError,
    instance,
    writeFileSync,
  } = useWebContainer({ templateData: templateData! });
  const lastSyncedContent = useRef<Map<string, string>>(new Map());
  const [previewKey, setPreviewKey] = React.useState(0);
  const [activeView, setActiveView] = useState("explorer");

  // Create wrapper functions that pass saveTemplateData
  const wrappedHandleAddFile = useCallback(
    (newFile: TemplateFile, parentPath: string) => {
      return handleAddFile(
        newFile,
        parentPath,
        writeFileSync!,
        instance,
        saveTemplateData,
      );
    },
    [handleAddFile, writeFileSync, instance, saveTemplateData],
  );

  const wrappedHandleAddFolder = useCallback(
    (newFolder: TemplateFolder, parentPath: string) => {
      return handleAddFolder(newFolder, parentPath, instance, saveTemplateData);
    },
    [handleAddFolder, instance, saveTemplateData],
  );

  const wrappedHandleDeleteFile = useCallback(
    (file: TemplateFile, parentPath: string) => {
      return handleDeleteFile(file, parentPath, saveTemplateData);
    },
    [handleDeleteFile, saveTemplateData],
  );

  const wrappedHandleDeleteFolder = useCallback(
    (folder: TemplateFolder, parentPath: string) => {
      return handleDeleteFolder(folder, parentPath, saveTemplateData);
    },
    [handleDeleteFolder, saveTemplateData],
  );

  const wrappedHandleRenameFile = useCallback(
    (
      file: TemplateFile,
      newFilename: string,
      newExtension: string,
      parentPath: string,
    ) => {
      return handleRenameFile(
        file,
        newFilename,
        newExtension,
        parentPath,
        saveTemplateData,
      );
    },
    [handleRenameFile, saveTemplateData],
  );

  const wrappedHandleRenameFolder = useCallback(
    (folder: TemplateFolder, newFolderName: string, parentPath: string) => {
      return handleRenameFolder(
        folder,
        newFolderName,
        parentPath,
        saveTemplateData,
      );
    },
    [handleRenameFolder, saveTemplateData],
  );

  const activeFile = openFiles.find((file) => file.id === activeFileId);
  const hasUnsavedChanges = openFiles.some((file) => file.hasUnsavedChanges);
  const [isPreviewVisible, setIsPreviewVisible] = React.useState(true);

  useEffect(() => {
    if (templateData && !openFiles.length) {
      setTemplateData(templateData);
    }
  }, [templateData, openFiles.length, setTemplateData]);

  const handleFileSelect = (file: TemplateFile) => {
    console.log("Handlepath", file);
    openFile(file);
  };

  const handleSave = useCallback(
    async (fileId?: string) => {
      const targetFileId = fileId || activeFileId;
      if (!targetFileId) {
        console.log("Save failed: No target file ID");
        return;
      }

      const fileToSave = openFiles.find((f) => f.id === targetFileId);
      if (!fileToSave) {
        console.log("Save failed: File not found in open files");
        return;
      }

      const latestTemplateData = useFileExplorer.getState().templateData;
      if (!latestTemplateData) {
        console.log("Save failed: No template data");
        return;
      }

      console.log(
        "Starting save for:",
        fileToSave.filename,
        fileToSave.fileExtension,
      );

      try {
        const filePath = findFilePath(fileToSave, latestTemplateData);
        if (!filePath) {
          toast.error(
            `Could not find path for file: ${fileToSave.filename}.${fileToSave.fileExtension}`,
          );
          return;
        }

        // Update file content in template data (clone for immutability)
        const updatedTemplateData = JSON.parse(
          JSON.stringify(latestTemplateData),
        );
        const updateFileContent = (
          items: (TemplateFile | TemplateFolder)[],
        ): (TemplateFile | TemplateFolder)[] =>
          items.map((item) => {
            if ("folderName" in item) {
              return { ...item, items: updateFileContent(item.items) };
            } else if (
              item.filename === fileToSave.filename &&
              item.fileExtension === fileToSave.fileExtension
            ) {
              return { ...item, content: fileToSave.content };
            }
            return item;
          });
        updatedTemplateData.items = updateFileContent(
          updatedTemplateData.items,
        );

        // Sync with WebContainer
        if (writeFileSync) {
          await writeFileSync(filePath, fileToSave.content);
          lastSyncedContent.current.set(fileToSave.id, fileToSave.content);
          if (instance && instance.fs) {
            await instance.fs.writeFile(filePath, fileToSave.content);
          }
        }

        // Use saveTemplateData to persist changes
        console.log("Saving to database...");
        await saveTemplateData(updatedTemplateData);
        console.log("Successfully saved to database");
        setTemplateData(updatedTemplateData);

        // Reload iframe for static files (HTML, CSS) after save
        if (filePath.match(/\.(html|css)$/)) {
          setPreviewKey((prev) => prev + 1);
        }

        // Update open files
        const updatedOpenFiles = openFiles.map((f) =>
          f.id === targetFileId
            ? {
                ...f,
                content: fileToSave.content,
                originalContent: fileToSave.content,
                hasUnsavedChanges: false,
              }
            : f,
        );
        setOpenFiles(updatedOpenFiles);

        toast.success(
          `Saved ${fileToSave.filename}.${fileToSave.fileExtension}`,
        );
      } catch (error) {
        console.error("Error saving file:", error);
        toast.error(
          `Failed to save ${fileToSave.filename}.${fileToSave.fileExtension}`,
        );
        throw error;
      }
    },
    [
      activeFileId,
      openFiles,
      writeFileSync,
      instance,
      saveTemplateData,
      setTemplateData,
      setOpenFiles,
    ],
  );

  const handleSaveAll = async () => {
    const unsavedFiles = openFiles.filter((f) => f.hasUnsavedChanges);

    if (unsavedFiles.length === 0) {
      toast.info("No unsaved changes");
      return;
    }

    try {
      await Promise.all(unsavedFiles.map((f) => handleSave(f.id)));
      toast.success(`Saved ${unsavedFiles.length} file(s)`);
    } catch {
      toast.error("Failed to save some files");
    }
  };

  // Add event to save file by click ctrl + s
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // Error state
  if (error || containerError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-4">
          {error ||
            (typeof containerError === "string"
              ? containerError
              : containerError?.message)}
        </p>
        <Button onClick={() => window.location.reload()} variant="destructive">
          Try Again
        </Button>
      </div>
    );
  }

  if (containerLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <div className="w-full max-w-md p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-6 text-center">
            Loading edditor
          </h2>
          <div className="mb-8">
            <LoadingStep
              currentStep={1}
              step={1}
              label="Initializing WebContainer"
            />
            <LoadingStep
              currentStep={2}
              step={2}
              label="Setting up file system"
            />
            <LoadingStep
              currentStep={3}
              step={3}
              label="Starting development server"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <ActivityBarProvider
        defaultView="explorer"
        onViewChange={(view) => {
          // Toggle: if clicking the same view, close sidebar
          setActiveView((prev) => (prev === view ? "" : view));
        }}
      >
        <div className="flex h-screen w-full">
          <ActivityBar>
            <ActivityBarItem
              icon={<Files className="h-6 w-6" />}
              label="Explorer"
              view="explorer"
            />
            <ActivityBarItem
              icon={<Search className="h-6 w-6" />}
              label="Search"
              view="search"
            />
            <ActivityBarItem
              icon={<GitBranch className="h-6 w-6" />}
              label="Source Control"
              view="source-control"
            />
            <ActivityBarItem
              icon={<Play className="h-6 w-6" />}
              label="Run and Debug"
              view="debug"
            />
            <ActivityBarItem
              icon={<Package className="h-6 w-6" />}
              label="Extensions"
              view="extensions"
            />
            <ActivityBarItem
              icon={<Users className="h-6 w-6" />}
              label="Collaboration"
              view="collaboration"
            />
            <ActivityBarSeparator />
            <ActivityBarSpacer />
            <ActivityBarItem
              icon={<User className="h-6 w-6" />}
              label="Account"
              view="account"
            />
            <ActivityBarItem
              icon={<Settings className="h-6 w-6" />}
              label="Settings"
              view="settings"
            />
          </ActivityBar>
          {activeView === "explorer" && (
            <ExplorerPanel
              data={templateData!}
              onFileSelect={handleFileSelect}
              selectedFile={activeFile}
              onAddFile={wrappedHandleAddFile}
              onAddFolder={wrappedHandleAddFolder}
              onDeleteFile={wrappedHandleDeleteFile}
              onDeleteFolder={wrappedHandleDeleteFolder}
              onRenameFile={wrappedHandleRenameFile}
              onRenameFolder={wrappedHandleRenameFolder}
            />
          )}
          {activeView === "search" && <SearchPanel />}
          {activeView === "source-control" && <SourceControlPanel />}
          {activeView === "debug" && <DebugPanel />}
          {activeView === "extensions" && <ExtensionsPanel />}
          {activeView === "collaboration" && <CollaborationPanel />}
          {activeView === "account" && <AccountPanel />}
          {activeView === "settings" && <SettingsPanel />}
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex flex-1 items-center gap-2 ">
                <div className="flex flex-col flex-1">
                  <h1 className="text-sm font-medium">
                    {editorData?.title || "Null Edditor"}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {openFiles.length} File(s) Opened
                    {hasUnsavedChanges && ". You have unsaved changes"}
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size={"sm"}
                      variant={"outline"}
                      onClick={() => {}}
                      disabled={!activeFile || !activeFile.hasUnsavedChanges}
                    >
                      <Save className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save (CTRL+S)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSaveAll()}
                      disabled={!hasUnsavedChanges}
                    >
                      <BookmarkPlus className="size-4" />
                      All
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save All (CTRL+SHIFT+S)</TooltipContent>
                </Tooltip>
                {/*    <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.info("AI feature coming soon!")}
                      disabled={false}
                    >
                      <BotIcon className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Hunter AI</TooltipContent>
                </Tooltip> */}
                <ToggelAI
                  isEnabled={aiSuggestion.isEnabled}
                  onToggle={aiSuggestion.toggleEnabled}
                  suggestionLoading={aiSuggestion.isLoading}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Settings className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                    >
                      {isPreviewVisible ? "Hide" : "Show"} Preview
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {}}>
                      Editor Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
            <div className="h-[calc(100vh-4rem)]">
              {openFiles.length > 0 ? (
                <div className="h-full flex flex-col">
                  <div className="border-b bg-muted/30">
                    <Tabs
                      value={activeFileId || ""}
                      onValueChange={setActiveFileId}
                    >
                      <div className="flex items-center justify-between px-4 py-2">
                        <TabsList className="h-8 bg-transparent p-0">
                          {openFiles.map((file) => (
                            <TabsTrigger
                              key={file.id}
                              value={file.id}
                              className="relative h-8  px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm group"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="size-3" />
                                <span className="max-w-[150px] truncate">
                                  {file.filename}.{file.fileExtension}
                                </span>
                                {file.hasUnsavedChanges && (
                                  <span
                                    className="h-2 w-2 rounded-full bg-orange-500 "
                                    title="Unsaved Changes"
                                  />
                                )}
                                <span
                                  className="ml-2 h-4 w-4 hover:bg-destructive hover:text-destructive-forground rounded-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer
                              
                              "
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    closeFile(file.id);
                                  }}
                                ></span>
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    className="absolute right-1 top-1 rounded p-1 opacity-0 hover:bg-red-500 group-hover:opacity-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      closeFile(file.id);
                                    }}
                                  >
                                    <X className="size-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Close File</TooltipContent>
                              </Tooltip>
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {openFiles.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => closeAllFiles()}
                          >
                            Close All
                          </Button>
                        )}
                      </div>
                    </Tabs>
                  </div>
                  <div className="flex-1">
                    <ResizablePanelGroup
                      direction="horizontal"
                      className="h-full"
                    >
                      <ResizablePanel defaultSize={isPreviewVisible ? 50 : 100}>
                        <CodeEditor
                          activeFile={activeFile}
                          content={activeFile?.content || ""}
                          onEditorMount={handleEditorMount}
                          onContentChange={async (value) => {
                            if (activeFileId && activeFile) {
                              updateFileContent(activeFileId, value);

                              // Sync changes to WebContainer in real-time (for dev server HMR)
                              if (writeFileSync && templateData && instance) {
                                const filePath = findFilePath(
                                  activeFile,
                                  templateData,
                                );
                                if (filePath) {
                                  try {
                                    await writeFileSync(filePath, value);
                                    await instance.fs.writeFile(
                                      filePath,
                                      value,
                                    );
                                  } catch (error) {
                                    console.error(
                                      "Failed to sync file to WebContainer:",
                                      error,
                                    );
                                  }
                                }
                              }
                            }
                          }}
                          suggestion={aiSuggestion.suggestion}
                          suggestionLoading={aiSuggestion.isLoading}
                          suggestionPosition={aiSuggestion.position}
                          onAcceptSuggestion={(editor, monaco) =>
                            aiSuggestion.acceptSuggestion(editor, monaco)
                          }
                          onTriggerSuggestion={(type, editor) =>
                            aiSuggestion.fetchSuggestion(type, editor)
                          }
                          onRejectSuggestion={(type, editor) =>
                            aiSuggestion.rejectSuggestion(type, editor)
                          }
                        />
                      </ResizablePanel>
                      {isPreviewVisible && (
                        <>
                          <ResizableHandle />
                          <ResizablePanel defaultSize={50}>
                            <WebContainerPreview
                              templateData={templateData!}
                              instance={instance}
                              writeFileSync={writeFileSync}
                              isLoading={containerLoading}
                              error={containerError}
                              serverUrl={serverUrl}
                              forceResetup={false}
                              previewKey={previewKey}
                            />
                          </ResizablePanel>
                        </>
                      )}
                    </ResizablePanelGroup>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4">
                  <AlertCircle className="size-16 text-muted-foreground" />
                  <p className="text-center text-sm text-muted-foreground">
                    No files are open. Please select a file from the file tree
                    to start editing.
                  </p>
                </div>
              )}
            </div>
          </SidebarInset>
        </div>
      </ActivityBarProvider>
    </TooltipProvider>
  );
};

export default Page;
