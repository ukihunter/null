import { useState, useEffect, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";

interface UseWebContainerProps {
  templateData?: unknown; // Adjust type as needed
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
}: UseWebContainerProps = {}): UseWebContainerReturn => {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [instance, setInstance] = useState<WebContainer | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initializeWebContainer() {
      try {
        setIsLoading(true);
        const webContainerInstance = await WebContainer.boot();

        if (!mounted) return;
        setInstance(webContainerInstance);
        // You can use templateData here if needed
      } catch (err) {
        console.error("Failed to boot WebContainer:", err);
        if (!mounted) return;
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to initialize WebContainer")
        );
      } finally {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateData]);

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
        const errorMessage =
          error instanceof Error ? error.message : "Failed to write file";
        console.error("Failed to write file:", error);
        throw new Error(`Failed to write file ${path}: ${errorMessage}`);
      }
    },
    [instance]
  );

  const destroy = useCallback(async (): Promise<void> => {
    if (instance) {
      instance.teardown();
      setInstance(null);
      setServerUrl(null);
    }
  }, [instance]);

  return {
    destroy,
    instance,
    isLoading,
    serverUrl,
    writeFileSync,
    error,
  };
};
