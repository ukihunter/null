import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const GET = async () => {
  // Only enable in non-production or with a secret param
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let dbUser = null;
  let dbError = null;
  let sessionCount = 0;

  try {
    dbUser = await db.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, email: true, name: true },
    });
    if (dbUser) {
      sessionCount = await db.edditorSession.count({
        where: { userId: dbUser.id },
      });
    }
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    sessionUserId: session.user.id,
    sessionEmail: session.user.email,
    dbUser,
    dbError,
    sessionCount,
    idMatch: session.user.id === dbUser?.id,
  });
};
