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
} from "lucide-react";
import { toast } from "sonner";

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

  // ── Create Session ──────────────────────────────────────────────────────────
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
      toast.success("Session created! Share the key to invite collaborators.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Copy Key ────────────────────────────────────────────────────────────────
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

  // ── Join Session ────────────────────────────────────────────────────────────
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
      router.push(`/editor/${data.edditorSessionId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6 transition-all">

        {/* ── Home View ── */}
        {view === "home" && (
          <>
            <div className="text-center space-y-1">
              <h2 className="text-base font-semibold flex items-center justify-center gap-2">
                <Users size={16} />
                Collaboration Session
              </h2>
              <p className="text-xs text-muted-foreground">
                Create a new session or join an existing one to collaborate in
                real-time.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleCreate}
                disabled={loading}
                className="w-full flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Plus size={15} />
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
                onClick={() => { setView("join"); setError(null); }}
                className="w-full flex items-center gap-2"
              >
                <LogIn size={15} />
                Join Existing Session
              </Button>
            </div>

            {error && (
              <p className="text-xs text-destructive text-center">{error}</p>
            )}
          </>
        )}

        {/* ── Created View ── */}
        {view === "created" && sessionKey && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-base font-semibold text-green-600">
                Session Created!
              </h2>
              <p className="text-xs text-muted-foreground">
                Share this key with your collaborators.
              </p>
            </div>

            <div className="bg-muted rounded-lg px-4 py-3 flex items-center justify-between font-mono text-lg tracking-widest border">
              <span className="truncate">{sessionKey}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="ml-2 shrink-0"
              >
                {copied ? (
                  <ClipboardCheckIcon size={16} className="text-green-500" />
                ) : (
                  <Clipboard size={16} />
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Anyone with this key can join your session.
            </p>

            <Button
              variant="outline"
              onClick={() => { setSessionKey(null); setView("home"); }}
              className="w-full"
            >
              Close Session
            </Button>
          </div>
        )}

        {/* ── Join View ── */}
        {view === "join" && (
          <div className="space-y-4">
            <button
              onClick={() => { setView("home"); setError(null); setJoinKey(""); }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={13} /> Back
            </button>

            <div className="text-center space-y-1">
              <h2 className="text-base font-semibold flex items-center justify-center gap-2">
                <LogIn size={16} />
                Join a Session
              </h2>
              <p className="text-xs text-muted-foreground">
                Enter the 8-character session key shared with you.
              </p>
            </div>

            <Input
              placeholder="e.g. AB12CD34"
              value={joinKey}
              onChange={(e) => {
                setJoinKey(e.target.value.toUpperCase());
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={8}
              className="text-center font-mono tracking-widest text-lg uppercase"
            />

            {error && (
              <p className="text-xs text-destructive text-center">{error}</p>
            )}

            <Button
              onClick={handleJoin}
              disabled={loading || joinKey.trim().length < 8}
              className="w-full flex items-center gap-2"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <LogIn size={15} />
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
