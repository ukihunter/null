import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// POST — Join a collaboration session (upsert so duplicates are safe)
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { sessionId, role } = body as {
    sessionId?: string;
    role?: "OWNER" | "EDITOR" | "VIEWER";
  };

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID required" },
      { status: 400 },
    );
  }

  // Verify the editor session exists
  const editorSession = await db.edditorSession.findUnique({
    where: { id: sessionId },
  });

  if (!editorSession) {
    return NextResponse.json(
      { error: "Editor session not found" },
      { status: 404 },
    );
  }

  // Determine role: session owner gets OWNER, everyone else gets the provided role or EDITOR
  const isOwner = editorSession.userId === session.user.id;
  const assignedRole = isOwner ? "OWNER" : role ?? "EDITOR";

  // Upsert so re-joining doesn't throw a duplicate key error
  const collaborator = await db.collaboratorSession.upsert({
    where: {
      userId_edditorSessionId: {
        userId: session.user.id,
        edditorSessionId: sessionId,
      },
    },
    update: {
      role: assignedRole,
      joinedAt: new Date(),
    },
    create: {
      edditorSessionId: sessionId,
      userId: session.user.id,
      role: assignedRole,
    },
  });

  return NextResponse.json(collaborator);
}

// DELETE — Leave a collaboration session
export async function DELETE(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID required" },
      { status: 400 },
    );
  }

  // Delete the collaborator record (ignore if not found)
  try {
    await db.collaboratorSession.delete({
      where: {
        userId_edditorSessionId: {
          userId: session.user.id,
          edditorSessionId: sessionId,
        },
      },
    });
  } catch {
    // Record may not exist — that's fine
  }

  return NextResponse.json({ success: true });
}

// GET — List all collaborators for a session
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID required" },
      { status: 400 },
    );
  }

  const collaborators = await db.collaboratorSession.findMany({
    where: { edditorSessionId: sessionId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json(collaborators);
}
