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
    if (!sessionId || !userId) {
      console.log(
        "useFileEditing: Waiting for sessionId and userId",
        { sessionId, userId },
      );
      return;
    }

    console.log("useFileEditing: Initializing with", {
      sessionId,
      userId,
      userName,
    });

    const pusher = getPusherClient();
    const channelName = `presence-session-${sessionId}`;
    const channel = pusher.subscribe(channelName) as PresenceChannel;
    channelRef.current = channel;

    // Listen for file editing state changes from OTHER users only
    channel.bind("client-file-editing-start", (data: FileEditingState) => {
      // Only store if it's from another user, NOT from ourselves
      if (data.userId !== userId) {
        console.log(
          `File editing start detected: User ${data.userName} editing ${data.fileId}`,
        );
        setFileEditing((prev) => {
          const next = new Map(prev);
          next.set(data.fileId, data);
          return next;
        });
      } else {
        console.log(
          `Ignoring own file-editing-start event for ${data.fileId}`,
        );
      }
    });

    channel.bind(
      "client-file-editing-stop",
      (data: { fileId: string; userId: string }) => {
        // Only remove if it's from another user
        if (data.userId !== userId) {
          console.log(
            `File editing stop detected: User stopped editing ${data.fileId}`,
          );
          setFileEditing((prev) => {
            const next = new Map(prev);
            next.delete(data.fileId);
            return next;
          });
        } else {
          console.log(
            `Ignoring own file-editing-stop event for ${data.fileId}`,
          );
        }
      },
    );

    return () => {
      console.log("useFileEditing: Cleaning up channel subscription");
      pusher.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [sessionId, userId, userName]);

  const startEditingFile = useCallback(
    (fileId: string) => {
      if (!channelRef.current || !userId) {
        console.warn(
          "startEditingFile: Cannot start - missing channel or userId",
          { hasChannel: !!channelRef.current, hasUserId: !!userId },
        );
        return;
      }

      // Only update local state, don't add to fileEditing map
      setCurrentEditingFileId(fileId);

      // Clear existing timeout
      if (editingTimeoutRef.current) {
        clearTimeout(editingTimeoutRef.current);
      }

      try {
        console.log(`Broadcasting file editing start: ${fileId} by ${userId}`);
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
          console.log(`Refreshing editing state for ${fileId}`);
          startEditingFile(fileId);
        }, 30000); // Refresh every 30 seconds
      } catch (error) {
        console.error("Failed to broadcast file editing start:", error);
      }
    },
    [userId, userName, userImage, currentUserColor],
  );

  const stopEditingFile = useCallback(
    (fileId: string) => {
      if (!channelRef.current) {
        console.warn(`stopEditingFile: Cannot stop - missing channel for ${fileId}`);
        return;
      }

      setCurrentEditingFileId(null);

      // Clear timeout
      if (editingTimeoutRef.current) {
        clearTimeout(editingTimeoutRef.current);
        editingTimeoutRef.current = null;
      }

      try {
        console.log(`Broadcasting file editing stop: ${fileId} by ${userId}`);
        channelRef.current.trigger("client-file-editing-stop", {
          fileId,
          userId,
        });
      } catch (error) {
        console.error("Failed to broadcast file editing stop:", error);
      }
    },
    [userId],
  );

  // Check if a specific file is being edited by someone else
  const isFileBeingEditedByOther = useCallback(
    (fileId: string) => {
      // If the current user is already editing this file, it should NOT be read-only
      // This handles the case where both users open simultaneously
      if (currentEditingFileId === fileId) {
        console.log(
          `isFileBeingEditedByOther(${fileId}): FALSE - current user is editing`,
        );
        return false;
      }

      // fileEditing map only contains OTHER users' editing states
      // If it's in here, someone else is editing it
      const editingState = fileEditing.get(fileId);
      const isEditing = editingState !== undefined;
      
      if (isEditing) {
        console.log(
          `isFileBeingEditedByOther(${fileId}): TRUE - ${editingState.userName} is editing`,
        );
      }
      
      return isEditing;
    },
    [fileEditing, currentEditingFileId],
  );

  // Get who is editing a file (only other users)
  const getFileEditor = useCallback(
    (fileId: string) => {
      const editingState = fileEditing.get(fileId);
      if (editingState) {
        return editingState;
      }
      return null;
    },
    [fileEditing],
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
