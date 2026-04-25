import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const ACTIVITY_PREFIX = "__COLLAB_ACTIVITY__:";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { sessionId, type, meta } = body as {
    sessionId?: string;
    type?: string;
    meta?: Record<string, string>;
  };

  if (!sessionId || !type) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const safeMeta = meta && Object.keys(meta).length > 0 ? meta : undefined;
  const content = `${ACTIVITY_PREFIX}${JSON.stringify({
    type,
    meta: safeMeta,
    at: new Date().toISOString(),
  })}`;

  const activity = await db.chatMessage.create({
    data: {
      content,
      edditorSessionId: sessionId,
      userId: session.user.id,
      userName: session.user.name ?? "Anonymous",
      userImage: session.user.image ?? null,
    },
  });

  return NextResponse.json(activity);
}

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 });
  }

  const records = await db.chatMessage.findMany({
    where: {
      edditorSessionId: sessionId,
      content: { startsWith: ACTIVITY_PREFIX },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(records);
}
