"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import type * as Monaco from "monaco-editor";

// ─── Protocol constants (must match server) ───────────
const MSG_SYNC = 0;
const MSG_AWARENESS = 1;
const MSG_SIGNAL = 2;

// ─── Types ────────────────────────────────────────────
export interface Peer {
  userId: string;
  name: string;
  color: string;
  cursor?: { lineNumber: number; column: number };
}

export interface UseCollaborationOptions {
  /** The collaboration session key (room name) */
  sessionKey: string;
  /** Current user id */
  userId: string;
  /** Current user display name */
  userName: string;
  /** User colour for cursor */
  userColor?: string;
  /** Monaco editor instance (optional — for cursor binding) */
  monacoEditor?: Monaco.editor.IStandaloneCodeEditor | null;
  /** Called when remote content change arrives for a file */
  onRemoteChange?: (fileId: string, content: string) => void;
}

const COLLAB_SERVER_URL =
  process.env.NEXT_PUBLIC_COLLAB_SERVER_URL || "ws://localhost:4000";

const USER_COLORS = [
  "#F87171",
  "#60A5FA",
  "#34D399",
  "#A78BFA",
  "#FBBF24",
  "#F472B6",
  "#38BDF8",
  "#4ADE80",
];

function getColor(userId: string) {
  let hash = 0;
  for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

// ─────────────────────────────────────────────────────
export function useCollaboration({
  sessionKey,
  userId,
  userName,
  userColor,
  monacoEditor,
  onRemoteChange,
}: UseCollaborationOptions) {
  const ydocRef = useRef<Y.Doc | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const awarenessRef = useRef<awarenessProtocol.Awareness | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [connected, setConnected] = useState(false);
  const monacoDecorations = useRef<string[]>([]);
  const suppressLocalRef = useRef(false);
  const color = userColor ?? getColor(userId);

  // ── Signal sender (used by useVoice) ──────────────────
  const sendSignal = useCallback((targetUserId: string, payload: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const enc = encoding.createEncoder();
    encoding.writeVarUint(enc, MSG_SIGNAL);
    encoding.writeVarString(enc, targetUserId);
    encoding.writeVarString(enc, payload);
    ws.send(encoding.toUint8Array(enc));
  }, []);

  // ── Signal listener registry ──────────────────────────
  const signalHandlers = useRef<
    Map<string, (from: string, payload: string) => void>
  >(new Map());

  const onSignal = useCallback(
    (key: string, handler: (from: string, payload: string) => void) => {
      signalHandlers.current.set(key, handler);
      return () => signalHandlers.current.delete(key);
    },
    [],
  );

  // ── Bind Yjs ↔ Monaco editor ──────────────────────────
  const bindEditorToYjs = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor, fileId: string) => {
      if (!ydocRef.current) return () => {};
      const ydoc = ydocRef.current;
      const yText = ydoc.getText(`file:${fileId}`);

      // Initial sync: push current editor content into Yjs if Yjs is empty
      const model = editor.getModel();
      if (!model) return () => {};

      if (yText.length === 0 && model.getValue()) {
        ydoc.transact(() => {
          yText.insert(0, model.getValue());
        });
      } else if (yText.length > 0) {
        suppressLocalRef.current = true;
        model.setValue(yText.toString());
        suppressLocalRef.current = false;
      }

      // Monaco → Yjs
      const disposable = model.onDidChangeContent((e) => {
        if (suppressLocalRef.current) return;
        ydoc.transact(() => {
          for (const change of [...e.changes].sort(
            (a, b) => b.rangeOffset - a.rangeOffset,
          )) {
            yText.delete(change.rangeOffset, change.rangeLength);
            if (change.text) yText.insert(change.rangeOffset, change.text);
          }
        });
      });

      // Yjs → Monaco
      const observer = () => {
        const yjsText = yText.toString();
        if (model.getValue() !== yjsText) {
          suppressLocalRef.current = true;
          const position = editor.getPosition();
          model.setValue(yjsText);
          if (position) editor.setPosition(position);
          suppressLocalRef.current = false;
          onRemoteChange?.(fileId, yjsText);
        }
      };
      yText.observe(observer);

      return () => {
        disposable.dispose();
        yText.unobserve(observer);
      };
    },
    [onRemoteChange],
  );

  // ── Render remote cursors ──────────────────────────────
  const renderCursors = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor) => {
      if (!awarenessRef.current) return;
      const states = awarenessRef.current.getStates();
      const newDecorations: Monaco.editor.IModelDeltaDecoration[] = [];

      states.forEach((state, clientId) => {
        if (clientId === ydocRef.current?.clientID) return;
        if (!state?.cursor) return;
        const { lineNumber, column, peerId, peerName } = state.cursor;
        newDecorations.push({
          range: {
            startLineNumber: lineNumber,
            startColumn: column,
            endLineNumber: lineNumber,
            endColumn: column + 1,
          },
          options: {
            className: `remote-cursor`,
            glyphMarginClassName: undefined,
            stickiness: 1,
            hoverMessage: { value: peerName || peerId || "Unknown" },
            afterContentClassName: `remote-cursor-label`,
            // Inline style via CSS variable trick
            zIndex: 10,
          },
        });
      });

      monacoDecorations.current = editor.deltaDecorations(
        monacoDecorations.current,
        newDecorations,
      );
    },
    [],
  );

  // ── Update awareness with cursor position ─────────────
  const updateCursor = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor) => {
      if (!awarenessRef.current) return;
      const position = editor.getPosition();
      if (!position) return;
      awarenessRef.current.setLocalStateField("cursor", {
        lineNumber: position.lineNumber,
        column: position.column,
        peerId: userId,
        peerName: userName,
        peerColor: color,
      });
    },
    [userId, userName, color],
  );

  // ── Connect to collab server ───────────────────────────
  useEffect(() => {
    if (!sessionKey) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    const awareness = new awarenessProtocol.Awareness(ydoc);
    awarenessRef.current = awareness;

    // Set local awareness state
    awareness.setLocalState({
      user: { id: userId, name: userName, color },
    });

    const wsUrl = `${COLLAB_SERVER_URL}/?room=${encodeURIComponent(sessionKey)}&userId=${encodeURIComponent(userId)}&clientId=${ydoc.clientID}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.binaryType = "arraybuffer";

    // Track whether this effect-run is still the active one
    let active = true;

    ws.onopen = () => {
      if (!active) return;
      setConnected(true);

      // Send sync step 1
      try {
        const enc = encoding.createEncoder();
        encoding.writeVarUint(enc, MSG_SYNC);
        syncProtocol.writeSyncStep1(enc, ydoc);
        ws.send(encoding.toUint8Array(enc));
      } catch (e) {
        console.error("[Collab] error sending sync step1:", e);
      }

      // Send initial awareness
      try {
        const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(
          awareness,
          [ydoc.clientID],
        );
        const enc2 = encoding.createEncoder();
        encoding.writeVarUint(enc2, MSG_AWARENESS);
        encoding.writeVarUint8Array(enc2, awarenessUpdate);
        ws.send(encoding.toUint8Array(enc2));
      } catch (e) {
        console.error("[Collab] error sending initial awareness:", e);
      }
    };

    ws.onclose = () => {
      if (active) setConnected(false);
    };

    ws.onmessage = (event) => {
      if (!active) return;
      try {
        const data = new Uint8Array(event.data as ArrayBuffer);
        const decoder = decoding.createDecoder(data);
        const msgType = decoding.readVarUint(decoder);

        if (msgType === MSG_SYNC) {
          const replyEncoder = encoding.createEncoder();
          encoding.writeVarUint(replyEncoder, MSG_SYNC);
          const syncType = syncProtocol.readSyncMessage(
            decoder,
            replyEncoder,
            ydoc,
            "remote",
          );
          // Reply only for step 1 — step 2 and updates need no response
          if (syncType === 0) {
            ws.send(encoding.toUint8Array(replyEncoder));
          }
        } else if (msgType === MSG_AWARENESS) {
          const update = decoding.readVarUint8Array(decoder);
          awarenessProtocol.applyAwarenessUpdate(awareness, update, "remote");
        } else if (msgType === MSG_SIGNAL) {
          const from = decoding.readVarString(decoder);
          const payload = decoding.readVarString(decoder);
          signalHandlers.current.forEach((handler) => handler(from, payload));
        }
      } catch (e) {
        console.error("[Collab] message decode error:", e);
      }
    };

    // Awareness → peers list (on change from remote)
    const updatePeers = () => {
      const states = awareness.getStates();
      const list: Peer[] = [];
      states.forEach((state, clientId) => {
        if (clientId === ydoc.clientID || !state?.user) return;
        list.push({
          userId: state.user.id,
          name: state.user.name,
          color: state.user.color,
          cursor: state.cursor,
        });
      });
      setPeers(list);
    };
    awareness.on("change", updatePeers);

    // Awareness → send local changes to server (cursor moves, etc.)
    const sendAwarenessUpdate = ({
      added,
      updated,
      removed,
    }: {
      added: number[];
      updated: number[];
      removed: number[];
    }) => {
      if (!active || ws.readyState !== WebSocket.OPEN) return;
      const changedClients = added.concat(updated).concat(removed);
      // Only forward if it includes our own clientID (local changes)
      if (!changedClients.includes(ydoc.clientID)) return;
      try {
        const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(
          awareness,
          [ydoc.clientID],
        );
        const enc = encoding.createEncoder();
        encoding.writeVarUint(enc, MSG_AWARENESS);
        encoding.writeVarUint8Array(enc, awarenessUpdate);
        ws.send(encoding.toUint8Array(enc));
      } catch (e) {
        console.error("[Collab] error sending awareness update:", e);
      }
    };
    awareness.on("update", sendAwarenessUpdate);

    // Forward local doc updates to server
    const sendDocUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === "remote" || !active || ws.readyState !== WebSocket.OPEN)
        return;
      try {
        const enc = encoding.createEncoder();
        encoding.writeVarUint(enc, MSG_SYNC);
        syncProtocol.writeUpdate(enc, update);
        ws.send(encoding.toUint8Array(enc));
      } catch (e) {
        console.error("[Collab] error sending doc update:", e);
      }
    };
    ydoc.on("update", sendDocUpdate);

    return () => {
      active = false;
      awareness.off("change", updatePeers);
      awareness.off("update", sendAwarenessUpdate);
      ydoc.off("update", sendDocUpdate);
      // Null out handlers BEFORE closing so stale events don't fire
      ws.onopen = null;
      ws.onmessage = null;
      ws.onclose = null;
      awareness.destroy();
      ydoc.destroy();
      ws.close();
      wsRef.current = null;
      ydocRef.current = null;
      awarenessRef.current = null;
      setConnected(false);
      setPeers([]);
    };
    // Only reconnect when the room changes — userId/userName are updated via awareness separately
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey]);

  // Update local awareness state when userId/userName changes without reconnecting
  useEffect(() => {
    if (!awarenessRef.current) return;
    awarenessRef.current.setLocalState({
      user: { id: userId, name: userName, color },
    });
  }, [userId, userName, color]);

  // ── Bind cursor tracking to Monaco ────────────────────
  useEffect(() => {
    if (!monacoEditor || !awarenessRef.current) return;
    const disposable = monacoEditor.onDidChangeCursorPosition(() =>
      updateCursor(monacoEditor),
    );
    const awarenessUnsub = awarenessRef.current.on("change", () =>
      renderCursors(monacoEditor),
    );
    return () => {
      disposable.dispose();
      awarenessRef.current?.off("change", awarenessUnsub as never);
    };
  }, [monacoEditor, updateCursor, renderCursors]);

  return {
    connected,
    peers,
    sendSignal,
    onSignal,
    bindEditorToYjs,
    ydoc: ydocRef.current,
  };
}
