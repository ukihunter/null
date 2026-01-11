import { useState, useEffectEvent, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";

import { TemplateFolder } from "@/features/edditor/lib/path-to-jason";

interface UseWebContainerProps {
  templateData: TemplateFolder | null;
}

interface UseWebContainerReturn {
  serverUrl: string | null;
  isLoading: boolean;
  error: Error | null;
  instance: WebContainer | null;
  writeFileSync: (path: string, content: string) => Promise<void>;
  destroy: () => Promise<void>;
}

export const useWebContainer = ({
  templateData,
}: UseWebContainerProps): UseWebContainerReturn => {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [instance, setInstance] = useState<WebContainer | null>(null);

  useEffectEvent(() => {
    let mounted = true;

    async function initializeWebContainer() {
      try {
        const webContainerInstance = await WebContainer.boot();

        if (!mounted) return;
        setInstance(webContainerInstance);
        setIsLoading(true);
      } catch (err) {
        console.error("Failed to boot WebContainer:", err);
        if (!mounted) return;
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to initialize WebContainer")
        );
        setIsLoading(false);
      }
    }

    initializeWebContainer();

    return () => {
      mounted = false;
      if (instance) {
        instance.teardown();
      }
    };
  });

  const writeFileSync = useCallback(
    async (path: string, content: string): Promise<void> => {
      if (!instance) {
        throw new Error("WebContainer instance is not initialized");
      }
      try {
        const pathParts = path.split("/");
        const folderPath = pathParts.slice(0, -1).join("/");

        if (folderPath) {
          await instance.fs.mkdir(folderPath, { recursive: true });
        }
        await instance.fs.writeFile(path, content);
      } catch (error) {
        console.error("Failed to write file:", error);
        throw error;
      }
    }
  );
};
