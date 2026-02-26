"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── STUN/TURN config ─────────────────────────────────
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  // Add TURN server here for strict NAT:
  // {
  //   urls: "turn:your-turn-server.com:3478",
  //   username: "user",
  //   credential: "password",
  // },
];

// Signal message types
type SignalPayload =
  | { type: "voice-offer"; sdp: string }
  | { type: "voice-answer"; sdp: string }
  | { type: "voice-ice"; candidate: RTCIceCandidateInit }
  | { type: "voice-leave" };

export interface UseVoiceOptions {
  userId: string;
  /** IDs of peers currently in the room */
  peerIds: string[];
  /** From useCollaboration */
  sendSignal: (targetUserId: string, payload: string) => void;
  /** Register a signal listener (returns unsubscribe fn) */
  onSignal: (
    key: string,
    handler: (from: string, payload: string) => void
  ) => () => void;
}

export function useVoice({ userId, peerIds, sendSignal, onSignal }: UseVoiceOptions) {
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  // peerId → RTCPeerConnection
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  // peerId → remote <audio> element
  const audioElemsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // ── Create peer connection for a specific peer ────────
  const createPeerConnection = useCallback(
    (peerId: string, isInitiator: boolean) => {
      if (pcsRef.current.has(peerId)) return pcsRef.current.get(peerId)!;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Add local tracks
      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });

      // ICE candidates → signal
      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        const payload: SignalPayload = {
          type: "voice-ice",
          candidate: e.candidate.toJSON(),
        };
        sendSignal(peerId, JSON.stringify(payload));
      };

      // Remote audio track → attach to audio element
      pc.ontrack = (e) => {
        let audio = audioElemsRef.current.get(peerId);
        if (!audio) {
          audio = new window.Audio();
          audio.autoplay = true;
          audioElemsRef.current.set(peerId, audio);
        }
        audio.srcObject = e.streams[0];
      };

      pcsRef.current.set(peerId, pc);

      if (isInitiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            const payload: SignalPayload = {
              type: "voice-offer",
              sdp: pc.localDescription!.sdp,
            };
            sendSignal(peerId, JSON.stringify(payload));
          })
          .catch(console.error);
      }

      return pc;
    },
    [sendSignal]
  );

  // ── Handle incoming signals ───────────────────────────
  useEffect(() => {
    const unsub = onSignal("voice", async (from, rawPayload) => {
      let payload: SignalPayload;
      try {
        payload = JSON.parse(rawPayload) as SignalPayload;
      } catch {
        return;
      }

      if (payload.type === "voice-offer") {
        const pc = createPeerConnection(from, false);
        await pc.setRemoteDescription(
          new RTCSessionDescription({ type: "offer", sdp: payload.sdp })
        );
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        const resp: SignalPayload = { type: "voice-answer", sdp: answer.sdp! };
        sendSignal(from, JSON.stringify(resp));
      } else if (payload.type === "voice-answer") {
        const pc = pcsRef.current.get(from);
        if (!pc) return;
        await pc.setRemoteDescription(
          new RTCSessionDescription({ type: "answer", sdp: payload.sdp })
        );
      } else if (payload.type === "voice-ice") {
        const pc = pcsRef.current.get(from);
        if (!pc) return;
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } else if (payload.type === "voice-leave") {
        const pc = pcsRef.current.get(from);
        pc?.close();
        pcsRef.current.delete(from);
        const audio = audioElemsRef.current.get(from);
        if (audio) {
          audio.srcObject = null;
          audioElemsRef.current.delete(from);
        }
      }
    });
    return unsub;
  }, [onSignal, createPeerConnection, sendSignal]);

  // ── Join call ──────────────────────────────────────────
  const joinCall = useCallback(async () => {
    if (inCall) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setInCall(true);

      // Initiate connections to all current peers
      peerIds.forEach((peerId) => {
        if (peerId !== userId) createPeerConnection(peerId, true);
      });
    } catch (err) {
      console.error("[Voice] getUserMedia error:", err);
    }
  }, [inCall, peerIds, userId, createPeerConnection]);

  // ── Leave call ─────────────────────────────────────────
  const leaveCall = useCallback(() => {
    if (!inCall) return;
    // Notify peers
    pcsRef.current.forEach((_, peerId) => {
      const payload: SignalPayload = { type: "voice-leave" };
      sendSignal(peerId, JSON.stringify(payload));
    });

    // Close all peer connections
    pcsRef.current.forEach((pc) => pc.close());
    pcsRef.current.clear();

    // Stop audio elements
    audioElemsRef.current.forEach((audio) => {
      audio.srcObject = null;
    });
    audioElemsRef.current.clear();

    // Stop local stream
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    setInCall(false);
    setMuted(false);
  }, [inCall, sendSignal]);

  // ── Toggle mute ────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const enabled = !muted;
    stream.getAudioTracks().forEach((t) => (t.enabled = enabled));
    setMuted(!muted);
  }, [muted]);

  // ── When new peer joins, call them ─────────────────────
  const prevPeerIdsRef = useRef<string[]>([]);
  useEffect(() => {
    if (!inCall) return;
    const newPeers = peerIds.filter(
      (id) => id !== userId && !prevPeerIdsRef.current.includes(id)
    );
    newPeers.forEach((peerId) => createPeerConnection(peerId, true));
    prevPeerIdsRef.current = peerIds;
  }, [peerIds, inCall, userId, createPeerConnection]);

  // Cleanup on unmount
  useEffect(() => () => { leaveCall(); }, []); // eslint-disable-line

  return { inCall, muted, joinCall, leaveCall, toggleMute };
}
