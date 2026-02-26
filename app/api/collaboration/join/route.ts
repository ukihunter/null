import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { sessionKey } = await req.json();

    if (!sessionKey) {
      return NextResponse.json(
        { error: "sessionKey is required" },
        { status: 400 },
      );
    }

    const session = await db.collaborationSession.findUnique({
      where: { sessionKey: sessionKey.toUpperCase().trim() },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found. Check the key and try again." },
        { status: 404 },
      );
    }

    if (!session.isActive) {
      return NextResponse.json(
        { error: "This session has been closed." },
        { status: 410 },
      );
    }

    if (new Date() > session.expiresAt) {
      await db.collaborationSession.update({
        where: { sessionKey },
        data: { isActive: false },
      });
      return NextResponse.json(
        { error: "This session has expired." },
        { status: 410 },
      );
    }

    return NextResponse.json({
      edditorSessionId: session.edditorSessionId,
      sessionKey: session.sessionKey,
    });
  } catch (error) {
    console.error("[COLLABORATION_JOIN]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
