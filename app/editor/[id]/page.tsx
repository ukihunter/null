"use client";

import React, { useEffect } from "react";
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
} from "lucide-react";
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
import { TemplateFile } from "@/features/edditor/lib/path-to-jason";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import CodeEditor from "@/features/edditor/components/Code-editor";
import { useWebContainer } from "@/features/webContaniers/hooks/useWebContaoner";
import WebContainerPreview from "@/features/webContaniers/components/webContainer-priview";

import LoadingStep from "@/components/ui/loader";
//import { error } from "console";

const Page = () => {
  const { id } = useParams() as { id?: string };
  const { editorData, templateData } = useEditor(id || "");

  const {
    activeFileId,
    closeAllFiles,
    openFile,
    closeFile,
    openFiles,
    setActiveFileId,
    setTemplateData,
    updateFileContent,
  } = useFileExplorer();

  const {
    serverUrl,
    isLoading: containerLoading,
    error: containerError,
    instance,
    writeFileSync,
  } = useWebContainer({ templateData: templateData! });
  const activeFile = openFiles.find((file) => file.id === activeFileId);
  const hasUnsavedChanges = openFiles.some((file) => file.hasUnsavedChanges);
  const [isPreviewVisible, setIsPreviewVisible] = React.useState(true);
  const handleFileSelect = (file: TemplateFile) => {
    console.log("Handlepath", file);
    openFile(file);
  };

  useEffect(() => {
    if (templateData && !openFiles.length) {
      setTemplateData(templateData);
    }
  }, [templateData, openFiles.length, setTemplateData]);

  if (containerError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600 mb-2">
          Something went Wrong
        </h2>
        <p className="text-gray-600 mb-4 ">
          {typeof containerError === "string"
            ? containerError
            : containerError?.message}
        </p>
        <Button onClick={() => window.location.reload()} variant="destructive">
          Try again
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
      <>
        <TemplateFileTree
          data={templateData!}
          onFileSelect={handleFileSelect}
          selectedFile={activeFile}
        />
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
                    onClick={() => closeAllFiles()}
                    disabled={!hasUnsavedChanges}
                  >
                    <BookmarkPlus className="size-4" />
                    All
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save All (CTRL+SHIFT+S)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => closeAllFiles()}
                    disabled={!hasUnsavedChanges}
                  >
                    <BotIcon className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Hunter AI</TooltipContent>
              </Tooltip>
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
                        onContentChange={(value) =>
                          activeFileId && updateFileContent(activeFileId, value)
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
                  No files are open. Please select a file from the file tree to
                  start editing.
                </p>
              </div>
            )}
          </div>
        </SidebarInset>
      </>
    </TooltipProvider>
  );
};

export default Page;
