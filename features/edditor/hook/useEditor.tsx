import { useState, useEffect, useCallback } from "react";

import { toast } from "sonner";
import { TemplateFolder } from "../lib/path-to-jason";
import { getEdditorById, saveUpdatedCode } from "../actions";

interface UseEditorData {
  id: string;
  title?: string;
  [key: string]: unknown;
}

interface UseEditorReturn {
  editorData: UseEditorData | null;
  templateData: TemplateFolder | null;
  isLoading: boolean;
  error: string | null;
  loadEditorData: () => Promise<void>;
  saveTemplateData: (data: TemplateFolder) => Promise<void>;
}

export const useEditor = (id: string): UseEditorReturn => {
  const [editorData, setEditorData] = useState<UseEditorData | null>(null);
  const [templateData, setTemplateData] = useState<TemplateFolder | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadEditorData = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getEdditorById(id);
      setEditorData(
        data
          ? {
              ...data,
              title: data.title === null ? undefined : data.title,
            }
          : null
      );
      const rawContent = data?.templateFiles?.[0]?.content;

      if (typeof rawContent === "string") {
        const parsedContent: TemplateFolder = JSON.parse(rawContent);
        setTemplateData(parsedContent);
        toast.success("Editor data loaded successfully");
        return;
      }
      const res = await fetch(`/api/template/${id}`);
      if (!res.ok) throw new Error(`No template data found : ${res.status} `);

      const templateRes = await res.json();
      if (templateRes.templateJson && Array.isArray(templateRes.templateJson)) {
        setTemplateData({
          folderName: "Root",
          items: templateRes.templateJson,
        });
      } else {
        setTemplateData(
          templateRes.templateJson || {
            folderName: "Root",
            items: [],
          }
        );
      }

      toast.success("Template loaded successfully");
    } catch {
      setError("Failed to load editor data");
      toast.error("Failed to load editor data");
    } finally {
      setIsLoading(false);
    }
  }, [id]);
  const saveTemplateData = useCallback(
    async (data: TemplateFolder) => {
      try {
        await saveUpdatedCode(id, data);
        setTemplateData(data);
        toast.success("Changes saved successfully");
      } catch (error) {
        console.error("Error saving template data:", error);
        toast.error("Failed to save changes");
        throw error;
      }
    },
    [id]
  );

  useEffect(() => {
    loadEditorData();
  }, [loadEditorData]);

  return {
    editorData,
    templateData,
    isLoading,
    error,
    loadEditorData,
    saveTemplateData,
  };
};
