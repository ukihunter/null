"use client";

import React from "react";
import { AlertCircle, Lock, Unlock } from "lucide-react";
import Image from "next/image";
import type { FileEditingState } from "../hook/useFileEditing";
import { Button } from "@/components/ui/button";

interface FileEditingIndicatorProps {
  editor: FileEditingState | null;
  currentUserId?: string;
  onUnlock?: () => void;
}

export const FileEditingIndicator: React.FC<FileEditingIndicatorProps> = ({
  editor,
  currentUserId,
  onUnlock
}) => {
  if (!editor) return null;

  const isCurrentUser = editor.userId === currentUserId;

  return (
    <div
      className="w-full px-4 py-3 bg-yellow-50 dark:bg-yellow-950 border-b border-yellow-200 dark:border-yellow-800 flex items-center gap-3 text-sm"
      style={{
        borderLeftColor: editor.color,
        borderLeftWidth: "4px",
      }}
    >
      {isCurrentUser ? (
        <Unlock className="w-4 h-4 text-yellow-700 dark:text-yellow-300 flex-shrink-0" />
      ) : (
        <Lock className="w-4 h-4 text-yellow-700 dark:text-yellow-300 flex-shrink-0" />
      )}

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
          <span className="font-semibold">{isCurrentUser ? "You" : editor.userName}</span> {isCurrentUser ? "are" : "is"} editing
          this file
        </p>
        <p className="text-xs text-yellow-700 dark:text-yellow-300">
          {isCurrentUser ? "File is locked for others." : "You can view but not edit"}
        </p>
      </div>

      {isCurrentUser && onUnlock && (
        <Button size="sm" variant="outline" className="mr-4 h-7 text-xs border-yellow-300 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-200 dark:hover:bg-yellow-900" onClick={onUnlock}>
          Unlock File
        </Button>
      )}

      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: editor.color }}
      >
        {editor.userName.charAt(0).toUpperCase()}
      </div>
    </div>
  );
};
