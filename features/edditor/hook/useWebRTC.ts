import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { CollabUser } from "./useCollaboration";

export function useWebRTC(
  currentUserId: string,
  activeUsers: CollabUser[],
  isCollaborationActive: boolean,
  triggerClientEvent: (eventName: string, data: any) => boolean,
  bindClientEvent: <T>(eventName: string, handler: (data: T) => void) => () => void,
  onLogActivity?: (type: string) => Promise<void>
) {
  const [callMode, setCallMode] = useState<"none" | "voice" | "video">("none");
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const [callElapsedSec, setCallElapsedSec] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [callMembers, setCallMembers] = useState<Record<string, { name: string; mode: "voice" | "video" }>>({});
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  
  const iceCandidateQueue = useRef<{to: string, candidate: RTCIceCandidateInit}[]>([]);
  const iceCandidateTimer = useRef<NodeJS.Timeout | null>(null);

  const getMedia = useCallback(async (mode: "voice" | "video") => {
    const constraints = mode === "video" ? { audio: true, video: true } : { audio: true, video: false };
    return navigator.mediaDevices.getUserMedia(constraints);
  }, []);

  const cleanupCall = useCallback(() => {
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setRemoteStreams({});
    setIsMuted(false);
    setCallStartedAt(null);
    setCallElapsedSec(0);
    pendingCandidatesRef.current.clear();
  }, []);

  const createPeerConnection = useCallback((targetUserId: string, mode: "voice" | "video", stream: MediaStream) => {
    const pc = new RTCPeerConnection({ 
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun.relay.metered.ca:80" },
        { 
          urls: "turn:global.relay.metered.ca:80", 
          username: "6fbb92f93ba62dc7c5f46dba", 
          credential: "/5SQTbl5vFNYCLiZ" 
        },
        { 
          urls: "turn:global.relay.metered.ca:80?transport=tcp", 
          username: "6fbb92f93ba62dc7c5f46dba", 
          credential: "/5SQTbl5vFNYCLiZ" 
        },
        { 
          urls: "turn:global.relay.metered.ca:443", 
          username: "6fbb92f93ba62dc7c5f46dba", 
          credential: "/5SQTbl5vFNYCLiZ" 
        },
        { 
          urls: "turns:global.relay.metered.ca:443?transport=tcp", 
          username: "6fbb92f93ba62dc7c5f46dba", 
          credential: "/5SQTbl5vFNYCLiZ" 
        }
      ] 
    });
    
    stream.getTracks().forEach((track) => {
      if (mode === "voice" && track.kind === "video") return;
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      const [incomingStream] = event.streams;
      if (incomingStream) {
        setRemoteStreams((prev) => ({ ...prev, [targetUserId]: incomingStream }));
      }
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      
      iceCandidateQueue.current.push({ to: targetUserId, candidate: event.candidate });
      
      if (!iceCandidateTimer.current) {
        iceCandidateTimer.current = setTimeout(() => {
          const candidatesByTarget: Record<string, RTCIceCandidateInit[]> = {};
          iceCandidateQueue.current.forEach(item => {
             if (!candidatesByTarget[item.to]) candidatesByTarget[item.to] = [];
             candidatesByTarget[item.to].push(item.candidate);
          });
          
          Object.entries(candidatesByTarget).forEach(([to, candidates]) => {
             triggerClientEvent("client-webrtc-ice-batch", { to, from: currentUserId, candidates });
          });
          
          iceCandidateQueue.current = [];
          iceCandidateTimer.current = null;
        }, 500); // Send candidates in batches every 500ms to avoid Pusher rate limits
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected" || pc.connectionState === "closed") {
        peerConnectionsRef.current.delete(targetUserId);
        setRemoteStreams((prev) => {
          const { [targetUserId]: _, ...rest } = prev;
          return rest;
        });
      }
    };

    peerConnectionsRef.current.set(targetUserId, pc);
    return pc;
  }, [currentUserId, triggerClientEvent]);

  const startCall = useCallback(async (mode: "voice" | "video") => {
    if (!isCollaborationActive) return;
    try {
      cleanupCall();
      const stream = await getMedia(mode);
      localStreamRef.current = stream;
    } catch {
      toast.error("Please allow microphone/camera permissions.");
      return;
    }
    setCallMode(mode);
    setCallStartedAt(Date.now());
    setCallElapsedSec(0);
    const currentUser = activeUsers.find((u) => u.id === currentUserId);
    triggerClientEvent("client-call-status", { action: "join", from: currentUserId, name: currentUser?.name ?? "You", mode });
    setCallMembers((prev) => ({ ...prev, [currentUserId]: { name: currentUser?.name ?? "You", mode } }));
    void onLogActivity?.(`${mode}_call_joined`);
  }, [cleanupCall, getMedia, isCollaborationActive, onLogActivity, triggerClientEvent, currentUserId, activeUsers]);

  const endCall = useCallback(() => {
    cleanupCall();
    triggerClientEvent("client-webrtc-ended", { from: currentUserId });
    triggerClientEvent("client-call-status", { action: "leave", from: currentUserId });
    if (callMode === "voice") void onLogActivity?.("voice_call_left");
    if (callMode === "video") void onLogActivity?.("video_call_left");
    setCallMode("none");
    setCallMembers({});
  }, [callMode, cleanupCall, currentUserId, onLogActivity, triggerClientEvent]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextMuted = !isMuted;
    stream.getAudioTracks().forEach((t) => { t.enabled = !nextMuted; });
    setIsMuted(nextMuted);
  }, [isMuted]);

  useEffect(() => {
    if (!isCollaborationActive) endCall();
  }, [isCollaborationActive, endCall]);

  useEffect(() => {
    if (callMode === "none" || !callStartedAt) return;
    const id = window.setInterval(() => {
      setCallElapsedSec(Math.floor((Date.now() - callStartedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [callMode, callStartedAt]);

  useEffect(() => {
    if (!isCollaborationActive || !currentUserId || !bindClientEvent) return;

    const offCallStatus = bindClientEvent<{ action: "join" | "leave"; from: string; name?: string; mode?: "voice" | "video" }>(
      "client-call-status",
      (data) => {
        if (!data?.from || data.from === currentUserId) return;
        if (data.action === "leave") {
          setCallMembers((prev) => { const { [data.from]: _, ...rest } = prev; return rest; });
        } else if (data.action === "join" && data.name && data.mode) {
          setCallMembers((prev) => ({ ...prev, [data.from]: { name: data.name!, mode: data.mode! } }));
        }
      }
    );

    const handleAcceptOffer = async (data: { to: string; from: string; sdp: RTCSessionDescriptionInit; mode: "voice" | "video" }) => {
      try {
        if (!localStreamRef.current) {
          const stream = await getMedia(data.mode);
          localStreamRef.current = stream;
          setCallMode(data.mode);
          
          const caller = activeUsers.find((u) => u.id === data.from);
          const me = activeUsers.find((u) => u.id === currentUserId);
          setCallMembers((prev) => ({
            ...prev,
            [currentUserId]: { name: me?.name ?? "You", mode: data.mode },
            [data.from]: { name: caller?.name ?? "User", mode: data.mode }
          }));
        }

        const pc = createPeerConnection(data.from, data.mode, localStreamRef.current!);
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

        // Flush any buffered candidates
        const pending = pendingCandidatesRef.current.get(data.from);
        if (pending) {
          for (const candidate of pending) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("ICE error", e));
          }
          pendingCandidatesRef.current.delete(data.from);
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        triggerClientEvent("client-webrtc-answer", { to: data.from, from: currentUserId, sdp: answer });
      } catch (e) {
        console.error("Failed to accept call", e);
      }
    };

    const offOffer = bindClientEvent<{ to: string; from: string; sdp: RTCSessionDescriptionInit; mode: "voice" | "video" }>(
      "client-webrtc-offer",
      (data) => {
        if (data.to !== currentUserId || data.from === currentUserId) return;
        
        // If we're already in a call, just connect silently
        if (callMode !== "none") {
          void handleAcceptOffer(data);
          return;
        }

        // Otherwise, it's an incoming call! Show ringing toast.
        const callerName = activeUsers.find((u) => u.id === data.from)?.name ?? "User";
        
        toast(`${callerName} is calling you via ${data.mode}`, {
          duration: 30000,
          id: `incoming-call-${data.from}`,
          position: "bottom-right",
          action: {
            label: "Accept",
            onClick: () => {
              toast.dismiss(`incoming-call-${data.from}`);
              void handleAcceptOffer(data);
            }
          },
          cancel: {
            label: "Decline",
            onClick: () => {
              toast.dismiss(`incoming-call-${data.from}`);
              triggerClientEvent("client-webrtc-declined", { to: data.from, from: currentUserId });
            }
          }
        });
      }
    );

    const offDeclined = bindClientEvent<{ to: string; from: string }>(
      "client-webrtc-declined",
      (data) => {
        if (data.to !== currentUserId) return;
        const declinerName = activeUsers.find((u) => u.id === data.from)?.name ?? "User";
        toast.error(`${declinerName} declined the call.`);
        
        // Close their PC
        const pc = peerConnectionsRef.current.get(data.from);
        if (pc) {
          pc.close();
          peerConnectionsRef.current.delete(data.from);
        }
      }
    );

    const offAnswer = bindClientEvent<{ to: string; from: string; sdp: RTCSessionDescriptionInit }>(
      "client-webrtc-answer",
      async (data) => {
        if (data.to !== currentUserId) return;
        const pc = peerConnectionsRef.current.get(data.from);
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

        // Flush any buffered candidates
        const pending = pendingCandidatesRef.current.get(data.from);
        if (pending) {
          for (const candidate of pending) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("ICE error", e));
          }
          pendingCandidatesRef.current.delete(data.from);
        }
      }
    );

    const offIceBatch = bindClientEvent<{ to: string; from: string; candidates: RTCIceCandidateInit[] }>(
      "client-webrtc-ice-batch",
      async (data) => {
        if (data.to !== currentUserId) return;
        const pc = peerConnectionsRef.current.get(data.from);
        
        for (const candidate of data.candidates) {
          if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("ICE error", e));
          } else {
            // Buffer candidate if PC is not ready or remoteDescription is not set
            const pending = pendingCandidatesRef.current.get(data.from) || [];
            pending.push(candidate);
            pendingCandidatesRef.current.set(data.from, pending);
          }
        }
      }
    );

    const offEnded = bindClientEvent<{ from: string }>("client-webrtc-ended", (data) => {
      // If the person who ended the call is the one we were talking to... 
      // Actually, if someone ends, we remove their stream. If no one is left, we can end.
      const pc = peerConnectionsRef.current.get(data.from);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(data.from);
        setRemoteStreams((prev) => {
          const { [data.from]: _, ...rest } = prev;
          return rest;
        });
      }
      
      // If no peer connections left and we're not waiting for others, maybe end call? 
      // For now, let user manually end call or stay in empty room.
    });

    return () => {
      offCallStatus();
      offOffer();
      offDeclined();
      offAnswer();
      offIceBatch();
      offEnded();
    };
  }, [activeUsers, bindClientEvent, callMode, currentUserId, getMedia, isCollaborationActive, triggerClientEvent]);

  // When we start a call, offer to everyone else
  useEffect(() => {
    if (!isCollaborationActive || callMode === "none" || !localStreamRef.current) return;

    activeUsers
      .filter((u) => u.id !== currentUserId)
      .forEach(async (user) => {
        if (peerConnectionsRef.current.has(user.id)) return;
        const pc = createPeerConnection(user.id, callMode, localStreamRef.current!);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        triggerClientEvent("client-webrtc-offer", { to: user.id, from: currentUserId, sdp: offer, mode: callMode });
      });
  }, [activeUsers, callMode, createPeerConnection, currentUserId, isCollaborationActive, triggerClientEvent]);

  return {
    callMode,
    callStartedAt,
    callElapsedSec,
    isMuted,
    remoteStreams,
    callMembers,
    localStreamRef,
    startCall,
    endCall,
    toggleMute,
  };
}
