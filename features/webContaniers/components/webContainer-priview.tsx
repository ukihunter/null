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

  useEffect(() => {
    if (forceResetup) {
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
    }
  }, [forceResetup]);

  useEffect(() => {
    async function setupcontainer() {
      if (!instance || isSetupComplete || isSetupInProgress) return;

      try {
        setIsSetupInProgress(true);
        try {
          const packaejsonExists = await instance.fs.readFile(
            "package.json",
            "utf-8"
          );
          if (packaejsonExists) {
            if (terminalRef.current?.writeToTerminal) {
              terminalRef.current.writeToTerminal(
                " Reconnecting to existing WebContainer session...\r\n"
              );
            }

            // Check if server is already running
            if (serverUrl) {
              if (terminalRef.current?.writeToTerminal) {
                terminalRef.current.writeToTerminal(
                  ` Server already running at ${serverUrl}\r\n`
                );
              }
              setPreviewUrl(serverUrl);
              setCurrentStep(4);
              setLoadingState((prev) => ({
                ...prev,
                starting: false,
                ready: true,
              }));
              setIsSetupComplete(true);
              setIsSetupInProgress(false);
              return;
            }

            // Set up server-ready listener
            instance.on("server-ready", (port: number, url: string) => {
              console.log(
                `Reconnected to the server on port ${port} at URL: ${url}`
              );
              if (terminalRef.current?.writeToTerminal) {
                terminalRef.current.writeToTerminal(
                  ` Reconnected to server at ${url}\r\n`
                );
              }

              setPreviewUrl(url);
              setLoadingState((prev) => ({
                ...prev,
                starting: false,
                ready: true,
              }));
              setIsSetupComplete(true);
              setIsSetupInProgress(false);
            });

            setCurrentStep(4);
            setLoadingState((prev) => ({ ...prev, starting: true }));

            // Kill existing server process if running
            if (serverProcessRef.current) {
              try {
                serverProcessRef.current.kill();
                if (terminalRef.current?.writeToTerminal) {
                  terminalRef.current.writeToTerminal(
                    " Stopping existing server...\r\n"
                  );
                }
              } catch (err) {
                console.log("No existing server to kill");
              }
            }

            // Restart the dev server
            if (terminalRef.current?.writeToTerminal) {
              terminalRef.current.writeToTerminal(
                " Starting development server...\r\n"
              );
            }
            const startProcess = await instance.spawn("npm", ["run", "start"]);
            serverProcessRef.current = startProcess;
            startProcess.output.pipeTo(
              new WritableStream({
                write(data) {
                  if (terminalRef.current?.writeToTerminal) {
                    terminalRef.current.writeToTerminal(data);
                  }
                },
              })
            );
            return;
          }
        } catch (err) {}
        //setup 1:transform data
        setLoadingState((prev) => ({ ...prev, transforming: true }));
        setCurrentStep(1);
        //terminal relate stuff
        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            "Transforming template data..\r\n"
          );
        }
        // @ts-ignore
        const files = await transformToWebContainerFormat(templateData);
        setLoadingState((prev) => ({
          ...prev,
          mounting: true,
          transforming: false,
        }));
        setCurrentStep(2);
        //terminal relate stuff

        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            "Moonting files to webContainer..\r\n"
          );
        }

        await instance.mount(files);

        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal("Files mounted successfully\r\n");
        }

        setLoadingState((prev) => ({
          ...prev,
          installing: true,
          mounting: false,
        }));
        setCurrentStep(3);
        //terminal relate stuff

        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            " Installing dependencies...\r\n"
          );
        }

        const installProcess = await instance.spawn("npm", ["install"]);
        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              // terminal relate stuff
              // For example: console.log(data);
              if (terminalRef.current?.writeToTerminal) {
                terminalRef.current.writeToTerminal(data);
              }
            },
          })
        );
        const installExitCode = await installProcess.exit;

        if (installExitCode !== 0) {
          throw new Error(
            `Dependency installation dependency installation failed.Exit code: " +
            ${installExitCode}`
          );
        }
        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            " Dependencies installed successfully\r\n"
          );
        }
        setLoadingState((prev) => ({
          ...prev,
          installing: false,
          starting: true,
        }));
        //terminal relate stuff
        setCurrentStep(4);
        const startProcess = await instance.spawn("npm", ["run", "start"]);
        serverProcessRef.current = startProcess;

        instance.on("server-ready", (port: number, url: string) => {
          console.log(`Server is running on port ${port} at URL: ${url}`);
          if (terminalRef.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal(` Server ready at ${url}\r\n`);
          }
          setPreviewUrl(url);
          setLoadingState((prev) => ({
            ...prev,
            starting: false,
            ready: true,
          }));
          setIsSetupComplete(true);
          setIsSetupInProgress(false);
        });

        startProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              // terminal relate stuff
              // For example: console.log(data);
              if (terminalRef.current?.writeToTerminal) {
                terminalRef.current.writeToTerminal(data);
              }
            },
          })
        );
      } catch (err) {
        console.error("Error setting up container:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(` Error: ${errorMessage}\r\n`);
        }

        setSetupError(errorMessage);
        setIsSetupInProgress(false);
        setLoadingState({
          transforming: false,
          mounting: false,
          installing: false,
          starting: false,
          ready: false,
        });
      }
    }
    setupcontainer();
  }, [instance, isSetupComplete, isSetupInProgress]);

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
              webContainerInstance={instance}
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
              webContainerInstance={instance}
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
