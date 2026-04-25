"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

export default function CallPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<any>(null);
  const mode = searchParams.get("mode") === "voice" ? "voice" : "video";

  useEffect(() => {
    const roomName = `null-ide-${params.sessionId}`;
    let mounted = true;

    const mountMeeting = () => {
      if (!mounted || !containerRef.current || !window.JitsiMeetExternalAPI) {
        return;
      }

      if (apiRef.current) {
        apiRef.current.dispose();
      }

      const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        configOverwrite: {
          prejoinPageEnabled: false,
          startWithAudioMuted: false,
          startWithVideoMuted: mode === "voice",
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          MOBILE_APP_PROMO: false,
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
        },
      });

      apiRef.current = api;
    };

    const existingScript = document.querySelector(
      'script[src="https://meet.jit.si/external_api.js"]',
    );

    if (existingScript) {
      mountMeeting();
    } else {
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = mountMeeting;
      document.body.appendChild(script);
    }

    return () => {
      mounted = false;
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [mode, params.sessionId]);

  return (
    <div className="h-full w-full bg-black">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
