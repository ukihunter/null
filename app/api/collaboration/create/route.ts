import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function generateSessionKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let key = "";
  for (let i = 0; i < 8; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export async function POST(req: NextRequest) {
  try {
    const { edditorSessionId } = await req.json();

    if (!edditorSessionId) {
      return NextResponse.json(
        { error: "edditorSessionId is required" },
        { status: 400 },
      );
    }

    // Generate a unique session key
    let sessionKey = generateSessionKey();
    let exists = await db.collaborationSession.findUnique({
      where: { sessionKey },
    });
    while (exists) {
      sessionKey = generateSessionKey();
      exists = await db.collaborationSession.findUnique({
        where: { sessionKey },
      });
    }

    // Expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const session = await db.collaborationSession.create({
      data: {
        sessionKey,
        edditorSessionId,
        expiresAt,
        participants: [],
      },
    });

    return NextResponse.json({
      sessionKey: session.sessionKey,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error("[COLLABORATION_CREATE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
