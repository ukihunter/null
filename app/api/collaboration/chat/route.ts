import { auth } from "@/auth";
import { db } from "@/lib/db";
import pusherServer from "@/lib/pusher";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { sessionId, content } = body;

  if (!sessionId || !content?.trim()) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const message = await db.chatMessage.create({
    data: {
      content: content.trim(),
      edditorSessionId: sessionId,
      userId: session.user.id,
      userName: session.user.name ?? "Anonymous",
      userImage: session.user.image ?? null,
    },
  });

  await pusherServer.trigger(`presence-session-${sessionId}`, "chat-message", {
    id: message.id,
    content: message.content,
    userId: message.userId,
    userName: message.userName,
    userImage: message.userImage,
    createdAt: message.createdAt.toISOString(),
  });

  return NextResponse.json(message);
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

  const messages = await db.chatMessage.findMany({
    where: { edditorSessionId: sessionId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json(messages);
}
