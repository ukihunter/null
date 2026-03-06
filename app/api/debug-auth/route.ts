import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const GET = async () => {
  // Check required environment variables (values hidden, only presence shown)
  const envCheck = {
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "(not set)",
    DATABASE_URL: !!process.env.DATABASE_URL,
    GITHUB_ID: !!(process.env.GITHUB_ID ?? process.env.AUTH_GITHUB_ID),
    GITHUB_SECRET: !!(process.env.GITHUB_SECRET ?? process.env.AUTH_GITHUB_SECRET),
    GOOGLE_ID: !!(process.env.GOOGLE_ID ?? process.env.AUTH_GOOGLE_ID),
    GOOGLE_SECRET: !!(process.env.GOOGLE_SECRET ?? process.env.AUTH_GOOGLE_SECRET),
  };

  const missingEnvVars = Object.entries(envCheck)
    .filter(([, v]) => v === false)
    .map(([k]) => k);

  let sessionInfo = null;
  let dbUser = null;
  let dbError = null;
  let sessionCount = 0;

  try {
    const session = await auth();
    if (session?.user) {
      sessionInfo = {
        userId: session.user.id,
        email: session.user.email,
      };

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
    }
  } catch (e) {
    sessionInfo = { error: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json({
    envCheck,
    missingEnvVars,
    session: sessionInfo,
    dbUser,
    dbError,
    sessionCount,
    idMatch: sessionInfo && dbUser
      ? (sessionInfo as { userId: string }).userId === dbUser.id
      : null,
  });
};
