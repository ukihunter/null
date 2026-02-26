"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clipboard,
  ClipboardCheckIcon,
  Users,
  Plus,
  LogIn,
  ArrowLeft,
  Loader2,
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Wifi,
  WifiOff,
  Circle,
} from "lucide-react";
import { toast } from "sonner";
import { useCollaborationContext } from "./CollaborationContext";

type View = "home" | "created" | "join";

const CollaborationSessionButtons = ({
  edditorSessionId,
}: {
  edditorSessionId: string;
}) => {
  const router = useRouter();
  const [view, setView] = useState<View>("home");
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [joinKey, setJoinKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
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
  } = useCollaborationContext();

  // ── Create Session ──────────────────────────────────────
  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/collaboration/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edditorSessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create session");
      setSessionKey(data.sessionKey);
      setView("created");
      startSession(data.sessionKey); // connect to collab WS
      toast.success("Session created! Share the key to invite collaborators.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Copy Key ────────────────────────────────────────────
  const handleCopy = () => {
    if (!sessionKey) return;
    navigator.clipboard
      .writeText(sessionKey)
      .then(() => {
        setCopied(true);
        toast.success("Session key copied to clipboard.");
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => toast.error("Failed to copy. Please copy manually."));
  };

  // ── Join Session ────────────────────────────────────────
  const handleJoin = async () => {
    if (!joinKey.trim()) {
      setError("Please enter a session key.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/collaboration/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionKey: joinKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not join session");
      toast.success("Joining session…");
      // Navigate with the key as a URL param so page.tsx calls startSession
      // AFTER the editor mounts — avoids startSession + router.push race condition.
      router.push(
        `/editor/${data.edditorSessionId}?joinSession=${joinKey.trim().toUpperCase()}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Active session panel ─────────────────────────────────
  if (activeSessionKey) {
    return (
      <div className="flex flex-col gap-4">
        {/* Status bar */}
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            {connected ? (
              <Wifi size={13} className="text-green-500" />
            ) : (
              <WifiOff size={13} className="text-muted-foreground" />
            )}
            {connected ? "Live" : "Connecting…"}
          </span>
          <span className="font-mono text-muted-foreground">
            {activeSessionKey}
          </span>
        </div>

        {/* Online peers */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Online ({peers.length + 1})
          </p>
          {/* Self */}
          <div className="flex items-center gap-2 px-2 py-1 rounded-md text-sm">
            <Circle size={8} className="fill-green-500 text-green-500" />
            <span className="text-xs">You</span>
          </div>
          {peers.map((peer) => (
            <div
              key={peer.userId}
              className="flex items-center gap-2 px-2 py-1 rounded-md text-sm"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: peer.color }}
              />
              <span className="text-xs truncate">{peer.name}</span>
            </div>
          ))}
        </div>

        {/* Voice controls */}
        <div className="border-t pt-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Voice
          </p>
          {!inCall ? (
            <Button
              size="sm"
              className="w-full flex items-center gap-2"
              onClick={joinCall}
            >
              <PhoneCall size={13} />
              Join Voice Call
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={muted ? "destructive" : "outline"}
                className="flex-1 flex items-center gap-1"
                onClick={toggleMute}
              >
                {muted ? <MicOff size={13} /> : <Mic size={13} />}
                {muted ? "Unmute" : "Mute"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1 flex items-center gap-1"
                onClick={leaveCall}
              >
                <PhoneOff size={13} />
                Leave
              </Button>
            </div>
          )}
        </div>

        {/* Leave session */}
        <Button
          size="sm"
          variant="ghost"
          className="w-full text-destructive hover:text-destructive text-xs"
          onClick={() => {
            endSession();
            setSessionKey(null);
            setView("home");
          }}
        >
          Leave Collaboration Session
        </Button>
      </div>
    );
  }

  // ── Setup panel (home / created / join) ─────────────────
  return (
    <div className="w-full">
      <div className="bg-card border rounded-xl p-4 shadow-sm space-y-5 transition-all">
        {/* Home */}
        {view === "home" && (
          <>
            <div className="text-center space-y-1">
              <h2 className="text-sm font-semibold flex items-center justify-center gap-2">
                <Users size={15} />
                Collaboration Session
              </h2>
              <p className="text-xs text-muted-foreground">
                Create or join a session to code together in real-time.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleCreate}
                disabled={loading}
                className="w-full flex items-center gap-2"
                size="sm"
              >
                {loading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Plus size={13} />
                )}
                Create New Session
              </Button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex-1 h-px bg-border" />
                OR
                <div className="flex-1 h-px bg-border" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setView("join");
                  setError(null);
                }}
                className="w-full flex items-center gap-2"
              >
                <LogIn size={13} />
                Join Existing Session
              </Button>
            </div>
            {error && (
              <p className="text-xs text-destructive text-center">{error}</p>
            )}
          </>
        )}

        {/* Created */}
        {view === "created" && sessionKey && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-sm font-semibold text-green-600">
                Session Created!
              </h2>
              <p className="text-xs text-muted-foreground">
                Share this key with your collaborators.
              </p>
            </div>
            <div className="bg-muted rounded-lg px-3 py-2 flex items-center justify-between font-mono text-base tracking-widest border">
              <span className="truncate">{sessionKey}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="ml-2 h-7 w-7"
              >
                {copied ? (
                  <ClipboardCheckIcon size={14} className="text-green-500" />
                ) : (
                  <Clipboard size={14} />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Anyone with this key can join.
            </p>
          </div>
        )}

        {/* Join */}
        {view === "join" && (
          <div className="space-y-4">
            <button
              onClick={() => {
                setView("home");
                setError(null);
                setJoinKey("");
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={12} /> Back
            </button>
            <div className="text-center space-y-1">
              <h2 className="text-sm font-semibold flex items-center justify-center gap-2">
                <LogIn size={15} />
                Join a Session
              </h2>
              <p className="text-xs text-muted-foreground">
                Enter the 8-character session key.
              </p>
            </div>
            <Input
              placeholder="AB12CD34"
              value={joinKey}
              onChange={(e) => {
                setJoinKey(e.target.value.toUpperCase());
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={8}
              className="text-center font-mono tracking-widest text-base uppercase"
            />
            {error && (
              <p className="text-xs text-destructive text-center">{error}</p>
            )}
            <Button
              onClick={handleJoin}
              disabled={loading || joinKey.trim().length < 8}
              className="w-full flex items-center gap-2"
              size="sm"
            >
              {loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <LogIn size={13} />
              )}
              Join Session
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborationSessionButtons;
