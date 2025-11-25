import { useState, useEffect, useCallback } from "react";

import { toast } from "sonner";
import { TemplateFolder } from "../lib/path-to-jason";
import { getEdditorById } from "../actions";
import { set } from "date-fns";

interface UseEditorData {
  id: string;
  name?: string;
  [key: string]: any;
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
      setEditorData(data);
      const rawContent = data?.TemplateFiles[0]?.content;

      if (typeof rawContent === "string") {
        const parsedContent: TemplateFolder = JSON.parse(rawContent);
        setTemplateData(parsedContent);
        toast.success("Editor data loaded successfully");
        return;
      }
      const res = await fetch(`/api/template/${id}`);
      if (res.ok) throw new Error(`No template data found : ${res.status} `);
    } catch (error) {
      setError("Failed to load editor data");
      toast.error("Failed to load editor data");
    } finally {
      setIsLoading(false);
    }
  }, [id]);
};
