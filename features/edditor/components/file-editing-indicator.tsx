"use client";

import React from "react";
import { AlertCircle, Lock } from "lucide-react";
import Image from "next/image";
import type { FileEditingState } from "../hook/useFileEditing";

interface FileEditingIndicatorProps {
  editor: FileEditingState | null;
}

export const FileEditingIndicator: React.FC<FileEditingIndicatorProps> = ({
  editor,
}) => {
  if (!editor) return null;

  return (
    <div
      className="w-full px-4 py-3 bg-yellow-50 dark:bg-yellow-950 border-b border-yellow-200 dark:border-yellow-800 flex items-center gap-3 text-sm"
      style={{
        borderLeftColor: editor.color,
        borderLeftWidth: "4px",
      }}
    >
      <Lock className="w-4 h-4 text-yellow-700 dark:text-yellow-300 flex-shrink-0" />

      {editor.userImage && (
        <Image
          src={editor.userImage}
          alt={editor.userName}
          width={24}
          height={24}
          className="rounded-full"
        />
      )}

      <div className="flex-1">
        <p className="text-yellow-800 dark:text-yellow-200">
          <span className="font-semibold">{editor.userName}</span> is editing
          this file
        </p>
        <p className="text-xs text-yellow-700 dark:text-yellow-300">
          You can view but not edit
        </p>
      </div>

      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: editor.color }}
      >
        {editor.userName.charAt(0).toUpperCase()}
      </div>
    </div>
  );
};
