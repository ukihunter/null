"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useId,
} from "react";
import { useSession } from "next-auth/react";
import { useCollaboration } from "./hooks/useCollaboration";
import { useVoice } from "./hooks/useVoice";
import type * as Monaco from "monaco-editor";

interface CollaborationContextValue {
  // Session
  activeSessionKey: string | null;
  startSession: (key: string) => void;
  endSession: () => void;
  // Collab state
  connected: boolean;
  peers: { userId: string; name: string; color: string }[];
  // Voice
  inCall: boolean;
  muted: boolean;
  joinCall: () => void;
  leaveCall: () => void;
  toggleMute: () => void;
  // Editor binding
  bindEditorToYjs: (
    editor: Monaco.editor.IStandaloneCodeEditor,
    fileId: string
  ) => () => void;
}

const CollaborationContext = createContext<CollaborationContextValue | null>(null);

export function CollaborationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const reactId = useId();
  const userId = session?.user?.email ?? `anon-${reactId}`;
  const userName = session?.user?.name ?? "Anonymous";

  const [activeSessionKey, setActiveSessionKey] = useState<string | null>(null);

  const { connected, peers, sendSignal, onSignal, bindEditorToYjs } =
    useCollaboration({
      sessionKey: activeSessionKey ?? "",
      userId,
      userName,
    });

  const { inCall, muted, joinCall, leaveCall, toggleMute } = useVoice({
    userId,
    peerIds: peers.map((p) => p.userId),
    sendSignal,
    onSignal,
  });

  const startSession = useCallback((key: string) => {
    setActiveSessionKey(key);
  }, []);

  const endSession = useCallback(() => {
    leaveCall();
    setActiveSessionKey(null);
  }, [leaveCall]);

  return (
    <CollaborationContext.Provider
      value={{
        activeSessionKey,
        startSession,
        endSession,
        connected,
        peers,
        inCall,
        muted,
        joinCall,
        leaveCall,
        toggleMute,
        bindEditorToYjs,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaborationContext() {
  const ctx = useContext(CollaborationContext);
  if (!ctx)
    throw new Error(
      "useCollaborationContext must be used inside CollaborationProvider"
    );
  return ctx;
}
