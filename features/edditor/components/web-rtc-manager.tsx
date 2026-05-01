import React, { useCallback, useEffect, useState } from "react";
import { GripHorizontal, Maximize2, Minimize2, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WebRTCManagerProps {
  callMode: "none" | "voice" | "video";
  callStartedAt: number | null;
  callElapsedSec: number;
  isMuted: boolean;
  remoteStreams: Record<string, MediaStream>;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  endCall: () => void;
  toggleMute: () => void;
}

export function WebRTCManager({
  callMode,
  callStartedAt,
  callElapsedSec,
  isMuted,
  remoteStreams,
  localVideoRef,
  endCall,
  toggleMute,
}: WebRTCManagerProps) {
  const [isVideoBoxMinimized, setIsVideoBoxMinimized] = useState(false);
  const [videoBoxPosition, setVideoBoxPosition] = useState({ x: 0, y: 0 });
  const [videoBoxPositionInitialized, setVideoBoxPositionInitialized] = useState(false);
  const dragStateRef = React.useRef({ dragging: false, offsetX: 0, offsetY: 0 });

  const formatDuration = useCallback((totalSec: number) => {
    const sec = Math.max(0, Math.floor(totalSec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const two = (n: number) => String(n).padStart(2, "0");
    return h > 0 ? `${two(h)}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || callMode !== "video" || videoBoxPositionInitialized) return;
    setVideoBoxPosition({
      x: Math.max(16, window.innerWidth - 304),
      y: Math.max(16, window.innerHeight - 220),
    });
    setVideoBoxPositionInitialized(true);
  }, [callMode, videoBoxPositionInitialized]);

  const handleVideoBoxMouseMove = useCallback((event: MouseEvent) => {
    if (!dragStateRef.current.dragging) return;
    const nextX = Math.max(8, event.clientX - dragStateRef.current.offsetX);
    const nextY = Math.max(8, event.clientY - dragStateRef.current.offsetY);
    setVideoBoxPosition({ x: nextX, y: nextY });
  }, []);

  const stopVideoBoxDragging = useCallback(() => {
    dragStateRef.current.dragging = false;
    window.removeEventListener("mousemove", handleVideoBoxMouseMove);
    window.removeEventListener("mouseup", stopVideoBoxDragging);
  }, [handleVideoBoxMouseMove]);

  const startVideoBoxDragging = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    dragStateRef.current.dragging = true;
    dragStateRef.current.offsetX = event.clientX - videoBoxPosition.x;
    dragStateRef.current.offsetY = event.clientY - videoBoxPosition.y;
    window.addEventListener("mousemove", handleVideoBoxMouseMove);
    window.addEventListener("mouseup", stopVideoBoxDragging);
  }, [handleVideoBoxMouseMove, stopVideoBoxDragging, videoBoxPosition.x, videoBoxPosition.y]);

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleVideoBoxMouseMove);
      window.removeEventListener("mouseup", stopVideoBoxDragging);
    };
  }, [handleVideoBoxMouseMove, stopVideoBoxDragging]);

  const MediaAudio = useCallback(({ stream }: { stream: MediaStream }) => {
    return (
      <audio
        autoPlay
        playsInline
        ref={(el) => {
          if (!el) return;
          if ((el as any).srcObject !== stream) {
            (el as any).srcObject = stream;
            // Play with a catch block in case of auto-play issues
            el.play().catch(e => console.warn("Audio autoplay blocked:", e));
          }
        }}
      />
    );
  }, []);

  const MediaVideo = useCallback(({ stream, muted, className }: { stream: MediaStream; muted?: boolean; className?: string }) => {
    return (
      <video
        autoPlay
        playsInline
        muted={!!muted}
        className={className}
        ref={(el) => {
          if (!el) return;
          if ((el as any).srcObject !== stream) {
            (el as any).srcObject = stream;
            el.play().catch(e => console.warn("Video autoplay blocked:", e));
          }
        }}
      />
    );
  }, []);

  if (callMode === "none") return null;

  return (
    <>
      {/* Remote audio for voice/video calls */}
      {Object.entries(remoteStreams).map(([userId, stream]) => (
        <div key={userId} className="hidden">
          <MediaAudio stream={stream} />
        </div>
      ))}

      {/* Floating mini video box */}
      {callMode === "video" && (
        <div
          className="fixed z-50 w-72 rounded-lg border bg-background shadow-xl"
          style={{ left: videoBoxPosition.x, top: videoBoxPosition.y }}
        >
          <div
            className="flex items-center justify-between border-b px-3 py-2 cursor-move select-none bg-muted/30 rounded-t-lg"
            onMouseDown={startVideoBoxDragging}
          >
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              Video Call Active
            </p>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setIsVideoBoxMinimized((prev) => !prev)}
              title={isVideoBoxMinimized ? "Restore" : "Minimize"}
            >
              {isVideoBoxMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
            </Button>
          </div>

          {!isVideoBoxMinimized && (
            <div className="p-0 bg-card rounded-b-lg">
              <div className="h-44 w-full bg-black overflow-hidden relative">
                <div
                  className="grid h-full w-full gap-1 bg-black p-1"
                  style={{ gridTemplateColumns: Object.keys(remoteStreams).length > 0 ? "1fr 1fr" : "1fr" }}
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full rounded object-cover transform scale-x-[-1]"
                  />
                  {Object.entries(remoteStreams).map(([userId, stream]) => (
                    <MediaVideo key={userId} stream={stream} className="h-full w-full rounded object-cover" />
                  ))}
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                    {formatDuration(callElapsedSec)}
                  </span>
                  <Button
                    size="sm"
                    variant={isMuted ? "destructive" : "outline"}
                    className="h-8 text-xs gap-1.5 flex-1 ml-2"
                    onClick={toggleMute}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <><MicOff className="h-3.5 w-3.5" /> Muted</>
                    ) : (
                      <><Mic className="h-3.5 w-3.5" /> Mute</>
                    )}
                  </Button>
                </div>
                <Button size="sm" variant="destructive" className="h-8 text-xs w-full font-medium" onClick={endCall}>
                  End Video Call
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
