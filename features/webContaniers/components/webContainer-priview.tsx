"use client";

import { TemplateFolder } from "@/features/edditor/lib/path-to-jason";
import React, { useEffect, useState, useRef } from "react";
import { WebContainer } from "@webcontainer/api";
import { CheckCircle, Loader2, X, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { transformToWebContainerFormat } from "../hooks/transfomer";
import { se } from "date-fns/locale";
import { start } from "repl";
import { set, url } from "zod";
import dynamic from "next/dynamic";

const TerminalComponent = dynamic(() => import("./termianl"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-black text-white">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  ),
});
interface WebContainerPreviewProps {
  templateData: TemplateFolder;
  serverUrl: string | null;
  isLoading: boolean;
  error: Error | null;
  instance: WebContainer | null;
  writeFileSync: (path: string, content: string) => Promise<void>;
  forceResetup?: boolean;
  previewKey?: number;
}

const killPort = async (instance: WebContainer, port: number, writeToTerminal?: (data: string) => void) => {
  try {
    if (writeToTerminal) writeToTerminal(`[System] Checking port ${port}...\r\n`);
    const killProcess = await instance.spawn("npx", ["-y", "kill-port", port.toString()]);
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));
    await Promise.race([killProcess.exit, timeout]);
    if (writeToTerminal) writeToTerminal(`[System] Port ${port} cleanup complete.\r\n`);
  } catch (err) {
    if (writeToTerminal) writeToTerminal(`[System] Port ${port} cleanup skipped.\r\n`);
    console.warn(`Could not kill port ${port}:`, err);
  }
};

const getStartCommand = async (instance: WebContainer): Promise<string> => {
  try {
    const pkgContent = await instance.fs.readFile("package.json", "utf-8");
    const pkg = JSON.parse(pkgContent);
    if (pkg.scripts?.dev) return "dev";
    if (pkg.scripts?.start) return "start";
    if (pkg.scripts?.serve) return "serve";
  } catch (e) {}
  return "start";
};

const WebContainerPreview = ({
  templateData,
  serverUrl,
  isLoading,
  error,
  instance,
  writeFileSync,
  forceResetup,
  previewKey = 0,
}: WebContainerPreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loadingState, setLoadingState] = useState({
    transforming: false,
    mounting: false,
    installing: false,
    starting: false,
    ready: false,
  });
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 4;
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isSetupInProgress, setIsSetupInProgress] = useState(false);
  const terminalRef = useRef<any>(null);
  const serverProcessRef = useRef<any>(null);
  const setupGenerationRef = useRef(0);
  const lastStructureRef = useRef<string>("");

  useEffect(() => {
    // Create a fingerprint of the project structure (filenames and folders)
    // to avoid resetting when only file content changes
    const getStructureFingerprint = (items: any[]): string => {
      return items
        .map((item) => {
          if (item.items) return `${item.folderName}(${getStructureFingerprint(item.items)})`;
          return `${item.filename}.${item.fileExtension}`;
        })
        .sort()
        .join("|");
    };

    const currentStructure = getStructureFingerprint(templateData.items);

    if (forceResetup || (currentStructure !== lastStructureRef.current && lastStructureRef.current !== "")) {
      lastStructureRef.current = currentStructure;
      setIsSetupComplete(false);
      setIsSetupInProgress(false);
      setPreviewUrl("");
      setCurrentStep(0);
      setLoadingState({
        transforming: false,
        mounting: false,
        installing: false,
        starting: false,
        ready: false,
      });
      setSetupError(null);
    } else if (lastStructureRef.current === "") {
      lastStructureRef.current = currentStructure;
    }
  }, [forceResetup, templateData.items]);

  useEffect(() => {
    async function setupcontainer() {
      if (!instance || isSetupComplete || isSetupInProgress) return;
      
      const generation = ++setupGenerationRef.current;
      
      try {
        // Wait for terminal to be ready (up to 5 seconds)
        let attempts = 0;
        while (!terminalRef.current?.writeToTerminal && attempts < 10) {
          await new Promise(r => setTimeout(r, 500));
          attempts++;
          if (generation !== setupGenerationRef.current) return;
        }

        setIsSetupInProgress(true);

        const write = (data: string) => {
          terminalRef.current?.writeToTerminal?.(data);
        };

        write("\r\n[System] Preparing environment for new template...\r\n");

        // 1. Cleanup old files
        write("[System] Cleaning up old files...\r\n");
        try {
          const entries = await instance.fs.readdir(".", { withFileTypes: true });
          for (const entry of entries) {
            if (entry.name !== "node_modules") {
              await instance.fs.rm(entry.name, { recursive: true }).catch(() => {});
            }
          }
        } catch (e) {}

        if (generation !== setupGenerationRef.current) return;

        // 2. Transform data
        setLoadingState((prev) => ({ ...prev, transforming: true }));
        setCurrentStep(1);
        write("[System] Transforming template data...\r\n");
        
        const files = await transformToWebContainerFormat(templateData);
        if (generation !== setupGenerationRef.current) return;

        // 3. Mount files
        setLoadingState((prev) => ({ ...prev, mounting: true, transforming: false }));
        setCurrentStep(2);
        write("[System] Mounting files to WebContainer...\r\n");
        await instance.mount(files);
        if (generation !== setupGenerationRef.current) return;

        // 4. Check if we need to install dependencies
        let nodeModulesExist = false;
        try {
          const entries = await instance.fs.readdir(".", { withFileTypes: true });
          nodeModulesExist = entries.some(e => e.name === "node_modules" && e.isDirectory());
        } catch (e) {}

        if (!nodeModulesExist) {
          setLoadingState((prev) => ({ ...prev, installing: true, mounting: false }));
          setCurrentStep(3);
          write("[System] Installing dependencies (this may take a minute)...\r\n");
          
          const installProcess = await instance.spawn("npm", ["install"]);
          installProcess.output.pipeTo(new WritableStream({
            write(data) {
              write(data);
            }
          }));
          const exitCode = await installProcess.exit;
          if (generation !== setupGenerationRef.current) return;
          if (exitCode !== 0) throw new Error(`Installation failed with code ${exitCode}`);
        } else {
          write("[System] node_modules found, skipping install.\r\n");
        }

        // 5. Start Server
        setLoadingState((prev) => ({ ...prev, installing: false, starting: true }));
        setCurrentStep(4);
        
        const startCmd = await getStartCommand(instance);
        write(`[System] Cleaning up ports and starting server with 'npm run ${startCmd}'...\r\n`);
        
        await killPort(instance, 3010, write);
        if (generation !== setupGenerationRef.current) return;

        const startProcess = await instance.spawn("npm", ["run", startCmd]);
        serverProcessRef.current = startProcess;

        instance.on("server-ready", (port: number, url: string) => {
          if (generation !== setupGenerationRef.current) return;
          console.log(`Server ready at ${url}`);
          write(`\r\n[System] Server ready at ${url}\r\n`);
          setPreviewUrl(url);
          setLoadingState((prev) => ({ ...prev, starting: false, ready: true }));
          setIsSetupComplete(true);
          setIsSetupInProgress(false);
        });

        startProcess.output.pipeTo(new WritableStream({
          write(data) {
            write(data);
          }
        }));

      } catch (err) {
        if (generation !== setupGenerationRef.current) return;
        console.error("Setup failed:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setSetupError(errorMessage);
        setIsSetupInProgress(false);
        write(`\r\n[Error] ${errorMessage}\r\n`);
      }
    }

    setupcontainer();
  }, [instance, isSetupComplete]);


  //cleanup funtion to prevent memory leaks
  useEffect(() => {
    return () => {};
  }, []);
  if (isLoading) {
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md p-6 rounded-lg bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <h3 className="text-lg font-medium">Initializing WebContainer</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Setting up your environment...
        </p>
      </div>
    </div>;
  }
  if (error || setupError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-lg max-w-md">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="h-5 w-5 " />
            <h3 className="font-semibold">Error loading WebContainer</h3>
          </div>
          <p className="text-sm ">{error?.message || setupError}</p>
        </div>
      </div>
    );
  }
  const getStepIcon = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (stepIndex === currentStep) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    } else {
      return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };
  const getStepText = (stepIndex: number, label: string) => {
    const isActive = stepIndex === currentStep;
    const isComplete = stepIndex < currentStep;

    return (
      <span
        className={`text-sm font-medium ${
          isComplete
            ? "text-green-600"
            : isActive
              ? "text-blue-600"
              : "text-gray-500"
        }`}
      >
        {label}
      </span>
    );
  };
  return (
    <div className="h-full w-full flex flex-col">
      {!previewUrl ? (
        <div className="h-full flex flex-col">
          <div className="max-w-md p-6 m-5 rounded-lg bg-white dark:bg-zinc-800 shadow-sm mx-auto">
            <h3 className="text-lg font-medium mb-4">
              setting up your Environment
            </h3>
            <Progress
              value={(currentStep / totalSteps) * 100}
              className="h-2 mb-6"
            />

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                {getStepIcon(1)}
                {getStepText(1, "Transforming template data")}
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(2)}
                {getStepText(2, "Mounting files")}
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(3)}
                {getStepText(3, "Installing dependencies")}
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(4)}
                {getStepText(4, "Starting development server")}
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-[300px] p-4">
            <TerminalComponent
              ref={terminalRef}
              WebContainer={instance}
              theme="dark"
              className="h-full"
            />
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          <div className="flex-1">
            <iframe
              key={previewKey}
              src={previewUrl}
              className="w-full h-full border-0"
              title="WebContainer Preview"
            />
          </div>
          <div className="h-64 border-t">
            <TerminalComponent
              ref={terminalRef}
              WebContainer={instance}
              theme="dark"
              className="h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};
export default WebContainerPreview;
