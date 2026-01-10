"use client";
import React, { useRef, useEffect, useCallback, act } from "react";

import Editor, { Monaco } from "@monaco-editor/react";
import { TemplateFile } from "../lib/path-to-jason";
import {
  configureMonaco,
  defaultEditorOptions,
  getEditorLanguage,
} from "../lib/editor-config";
import { ca } from "date-fns/locale";
import { Value } from "@radix-ui/react-select";
interface CodeEditorProps {
  activeFile: TemplateFile | undefined;
  content: string;
  onContentChange(value: string): void;
}

const CodeEditor = ({
  activeFile,
  content,
  onContentChange,
}: CodeEditorProps) => {
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = useCallback((editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    configureMonaco(monaco);
    updateEditorLanguage();
  }, []);
  const updateEditorLanguage = () => {
    if (!activeFile || !monacoRef.current || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;
    const language = getEditorLanguage(activeFile.fileExtension || "");
    try {
      monacoRef.current.editor.setModelLanguage(model, language);
    } catch (error) {
      console.error("Error setting model language:", error);
    }
  };

  useEffect(() => {
    updateEditorLanguage();
  }, [activeFile]);

  return (
    <div className="h-full relative">
      {/*Ai*/}
      <Editor
        height={"100%"}
        value={content}
        onChange={(value) => onContentChange(value || "")}
        onMount={handleEditorDidMount}
        language={
          activeFile
            ? getEditorLanguage(activeFile.fileExtension || "")
            : "plaintext"
        }
        //@ts-ignore
        options={defaultEditorOptions}
      />
    </div>
  );
};

export default CodeEditor;
