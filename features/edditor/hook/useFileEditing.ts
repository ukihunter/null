"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import type { PresenceChannel } from "pusher-js";

export interface FileEditingState {
  fileId: string;
  userId: string;
  userName: string;
  userImage: string | null;
  color: string;
  startedAt: string;
}

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
];

function generateColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function useFileEditing(
  sessionId: string,
  userId: string,
  userName: string,
  userImage: string | null,
) {
  const [fileEditing, setFileEditing] = useState<Map<string, FileEditingState>>(
    new Map(),
  );
  const [currentEditingFileId, setCurrentEditingFileId] = useState<
    string | null
  >(null);
  const channelRef = useRef<PresenceChannel | null>(null);
  const editingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserColor = generateColor(userId);

  useEffect(() => {
    if (!sessionId || !userId) return;

    const pusher = getPusherClient();
    const channelName = `presence-session-${sessionId}`;
    const channel = pusher.subscribe(channelName) as PresenceChannel;
    channelRef.current = channel;

    // Listen for file editing state changes
    channel.bind(
      "client-file-editing-start",
      (data: FileEditingState) => {
        setFileEditing((prev) => {
          const next = new Map(prev);
          next.set(data.fileId, data);
          return next;
        });
      },
    );

    channel.bind("client-file-editing-stop", (data: { fileId: string }) => {
      setFileEditing((prev) => {
        const next = new Map(prev);
        next.delete(data.fileId);
        return next;
      });
    });

    return () => {
      pusher.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [sessionId, userId]);

  const startEditingFile = useCallback(
    (fileId: string) => {
      if (!channelRef.current || !userId) return;

      setCurrentEditingFileId(fileId);

      // Clear existing timeout
      if (editingTimeoutRef.current) {
        clearTimeout(editingTimeoutRef.current);
      }

      try {
        channelRef.current.trigger("client-file-editing-start", {
          fileId,
          userId,
          userName,
          userImage,
          color: currentUserColor,
          startedAt: new Date().toISOString(),
        });

        // Reset the timeout to refresh the editing state periodically
        editingTimeoutRef.current = setTimeout(() => {
          if (currentEditingFileId === fileId) {
            startEditingFile(fileId);
          }
        }, 30000); // Refresh every 30 seconds
      } catch (error) {
        console.error("Failed to broadcast file editing start:", error);
      }
    },
    [userId, userName, userImage, currentUserColor, currentEditingFileId],
  );

  const stopEditingFile = useCallback(
    (fileId: string) => {
      if (!channelRef.current) return;

      setCurrentEditingFileId(null);

      // Clear timeout
      if (editingTimeoutRef.current) {
        clearTimeout(editingTimeoutRef.current);
        editingTimeoutRef.current = null;
      }

      try {
        channelRef.current.trigger("client-file-editing-stop", {
          fileId,
        });
      } catch (error) {
        console.error("Failed to broadcast file editing stop:", error);
      }
    },
    [],
  );

  // Check if a specific file is being edited by someone else
  const isFileBeingEditedByOther = useCallback(
    (fileId: string) => {
      const editingState = fileEditing.get(fileId);
      return editingState && editingState.userId !== userId;
    },
    [fileEditing, userId],
  );

  // Get who is editing a file
  const getFileEditor = useCallback(
    (fileId: string) => {
      const editingState = fileEditing.get(fileId);
      if (editingState && editingState.userId !== userId) {
        return editingState;
      }
      return null;
    },
    [fileEditing, userId],
  );

  return {
    fileEditing,
    currentEditingFileId,
    startEditingFile,
    stopEditingFile,
    isFileBeingEditedByOther,
    getFileEditor,
  };
}
