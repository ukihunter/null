"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import type { PresenceChannel } from "pusher-js";
import { useSession } from "next-auth/react";

export interface CollabUser {
  id: string;
  name: string;
  image: string | null;
  email: string | null;
  color: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  userName: string | null;
  userImage: string | null;
  createdAt: string;
}

export interface CursorPosition {
  userId: string;
  userName: string;
  fileId: string;
  line: number;
  column: number;
  color: string;
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

interface PusherMembers {
  each: (fn: (member: PusherMember) => void) => void;
}

interface PusherMember {
  id: string;
  info: Record<string, string | null>;
}

export function useCollaboration(sessionId: string) {
  const { data: authSession } = useSession();
  const userId = authSession?.user?.id ?? "";
  const userName = authSession?.user?.name ?? "Anonymous";

  const [activeUsers, setActiveUsers] = useState<CollabUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(
    new Map(),
  );
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<PresenceChannel | null>(null);

  const currentUserColor = useMemo(() => generateColor(userId), [userId]);

  useEffect(() => {
    if (!sessionId || !userId) return;

    // Load initial messages via promise chain
    fetch(`/api/collaboration/chat?sessionId=${sessionId}`)
      .then((res) => (res.ok ? (res.json() as Promise<ChatMessage[]>) : []))
      .then((data) => setMessages(data as ChatMessage[]))
      .catch(console.error);

    const pusher = getPusherClient();
    const channelName = `presence-session-${sessionId}`;
    const channel = pusher.subscribe(channelName) as PresenceChannel;
    channelRef.current = channel;

    channel.bind("pusher:subscription_succeeded", (members: PusherMembers) => {
      setIsConnected(true);
      const users: CollabUser[] = [];
      members.each((member: PusherMember) => {
        users.push({
          id: member.id,
          name: member.info?.name ?? "Anonymous",
          image: member.info?.image ?? null,
          email: member.info?.email ?? null,
          color: generateColor(member.id),
        });
      });
      setActiveUsers(users);
    });

    channel.bind("pusher:member_added", (member: PusherMember) => {
      setActiveUsers((prev) => {
        if (prev.find((u) => u.id === member.id)) return prev;
        return [
          ...prev,
          {
            id: member.id,
            name: member.info?.name ?? "Anonymous",
            image: member.info?.image ?? null,
            email: member.info?.email ?? null,
            color: generateColor(member.id),
          },
        ];
      });
    });

    channel.bind("pusher:member_removed", (member: PusherMember) => {
      setActiveUsers((prev) => prev.filter((u) => u.id !== member.id));
      setCursors((prev) => {
        const next = new Map(prev);
        next.delete(member.id);
        return next;
      });
    });

    channel.bind("chat-message", (data: ChatMessage) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
    });

    channel.bind(
      "client-code-change",
      (data: { fileId: string; content: string; userId: string }) => {
        if (data.userId === userId) return;
        window.dispatchEvent(
          new CustomEvent("collab-code-change", { detail: data }),
        );
      },
    );

    channel.bind("client-cursor-move", (data: CursorPosition) => {
      if (data.userId === userId) return;
      console.log(`Received cursor move from ${data.userName}:`, {
        fileId: data.fileId,
        line: data.line,
        column: data.column,
        color: data.color,
      });
      setCursors((prev) => {
        const next = new Map(prev);
        next.set(data.userId, data);
        console.log("Updated cursors map:", Array.from(next.entries()));
        return next;
      });
    });

    return () => {
      pusher.unsubscribe(channelName);
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [sessionId, userId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !sessionId) return;
      try {
        await fetch("/api/collaboration/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, content }),
        });
      } catch (e) {
        console.error("Failed to send message", e);
      }
    },
    [sessionId],
  );

  const broadcastCodeChange = useCallback(
    (fileId: string, content: string) => {
      if (!channelRef.current || !userId) return;
      try {
        channelRef.current.trigger("client-code-change", {
          fileId,
          content,
          userId,
        });
      } catch {
        // Silently ignore — requires authenticated presence channel
      }
    },
    [userId],
  );

  const broadcastCursor = useCallback(
    (fileId: string, line: number, column: number) => {
      if (!channelRef.current || !userId) {
        console.warn(
          "Cannot broadcast cursor - channel not ready",
          channelRef.current ? "channel exists" : "no channel",
        );
        return;
      }
      try {
        // Ensure channel is subscribed before triggering
        if (!channelRef.current.subscribed) {
          console.warn("Channel not subscribed yet, queuing cursor broadcast");
          setTimeout(() => broadcastCursor(fileId, line, column), 100);
          return;
        }

        console.log(
          `Broadcasting cursor for file ${fileId}: line ${line}, col ${column}`,
        );
        const event = channelRef.current.trigger("client-cursor-move", {
          userId,
          userName,
          fileId,
          line,
          column,
          color: currentUserColor,
        });
        console.log("Cursor broadcast result:", event);
      } catch (error) {
        console.error("Failed to broadcast cursor:", error);
      }
    },
    [userId, userName, currentUserColor],
  );

  return {
    activeUsers,
    messages,
    cursors,
    isConnected,
    sendMessage,
    broadcastCodeChange,
    broadcastCursor,
    currentUserId: userId,
    currentUserColor,
  };
}
