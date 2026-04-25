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

function isIncomingLockHigherPriority(
  incoming: FileEditingState,
  current: FileEditingState,
): boolean {
  const incomingTime = new Date(incoming.startedAt).getTime();
  const currentTime = new Date(current.startedAt).getTime();

  if (incomingTime !== currentTime) {
    return incomingTime < currentTime;
  }

  return incoming.userId < current.userId;
}

export function useFileEditing(
  sessionId: string,
  userId: string,
  userName: string,
  userImage: string | null,
  enabled = true,
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
    if (!enabled) {
      setCurrentEditingFileId(null);
      setFileEditing(new Map());
    }
  }, [enabled]);

  useEffect(() => {
    if (!sessionId || !userId || !enabled) {
      console.log("useFileEditing: Waiting for sessionId and userId", {
        sessionId,
        userId,
        enabled,
      });
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
      console.log(
        `File editing start detected: User ${data.userName} editing ${data.fileId}`,
      );
      setFileEditing((prev) => {
        const next = new Map(prev);
        const existing = next.get(data.fileId);

        // Keep a deterministic winner if 2 users start editing at nearly same time.
        if (!existing || isIncomingLockHigherPriority(data, existing)) {
          next.set(data.fileId, data);
        }

        return next;
      });
    });

    channel.bind(
      "client-file-editing-stop",
      (data: { fileId: string; userId: string }) => {
        console.log(
          `File editing stop detected: User stopped editing ${data.fileId}`,
        );
        setFileEditing((prev) => {
          const next = new Map(prev);
          const existing = next.get(data.fileId);
          if (existing?.userId === data.userId) {
            next.delete(data.fileId);
          }
          return next;
        });
      },
    );

    return () => {
      console.log("useFileEditing: Cleaning up channel subscription");
      pusher.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [sessionId, userId, userName, enabled]);

  const startEditingFile = useCallback(
    (fileId: string) => {
      if (!channelRef.current || !userId) {
        console.warn(
          "startEditingFile: Cannot start - missing channel or userId",
          { hasChannel: !!channelRef.current, hasUserId: !!userId },
        );
        return;
      }
      if (!enabled) return;

      const lockData: FileEditingState = {
        fileId,
        userId,
        userName,
        userImage,
        color: currentUserColor,
        startedAt: new Date().toISOString(),
      };

      const existingLock = fileEditing.get(fileId);
      if (existingLock && existingLock.userId !== userId) {
        console.log(
          `Cannot acquire lock for ${fileId}. Owned by ${existingLock.userName}.`,
        );
        return;
      }

      // Only update local state, don't add to fileEditing map
      setCurrentEditingFileId(fileId);
      setFileEditing((prev) => {
        const next = new Map(prev);
        next.set(fileId, lockData);
        return next;
      });

      // Clear existing timeout
      if (editingTimeoutRef.current) {
        clearTimeout(editingTimeoutRef.current);
      }

      try {
        console.log(`Broadcasting file editing start: ${fileId} by ${userId}`);
        channelRef.current.trigger("client-file-editing-start", lockData);

        // Reset the timeout to refresh the editing state periodically
        editingTimeoutRef.current = setTimeout(() => {
          console.log(`Refreshing editing state for ${fileId}`);
          startEditingFile(fileId);
        }, 30000); // Refresh every 30 seconds
      } catch (error) {
        console.error("Failed to broadcast file editing start:", error);
      }
    },
    [userId, userName, userImage, currentUserColor, fileEditing, enabled],
  );

  const stopEditingFile = useCallback(
    (fileId: string) => {
      if (!channelRef.current) {
        console.warn(
          `stopEditingFile: Cannot stop - missing channel for ${fileId}`,
        );
        return;
      }
      if (!enabled) return;

      setCurrentEditingFileId(null);
      setFileEditing((prev) => {
        const next = new Map(prev);
        const existing = next.get(fileId);
        if (existing?.userId === userId) {
          next.delete(fileId);
        }
        return next;
      });

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
    [userId, enabled],
  );

  // Check if a specific file is being edited by someone else
  const isFileBeingEditedByOther = useCallback(
    (fileId: string) => {
      const editingState = fileEditing.get(fileId);
      const isEditingByOther =
        editingState !== undefined && editingState.userId !== userId;

      if (isEditingByOther) {
        console.log(
          `isFileBeingEditedByOther(${fileId}): TRUE - ${editingState.userName} is editing`,
        );
      }

      return isEditingByOther;
    },
    [fileEditing, userId],
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
