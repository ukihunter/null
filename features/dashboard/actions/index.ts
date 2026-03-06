"use server";

//import { deeEdditorSession } from "./index";

import { currentUser } from "@/features/auth/actions";
import { db } from "@/lib/db";
import type { Templates } from "@prisma/client";
//import { ca } from "date-fns/locale";
import { revalidatePath } from "next/cache";

export const createEdditorsession = async (data: {
  title: string;
  description: string;
  template: Templates;
  userId: string;
}) => {
  const { template, title, description } = data;

  const user = await currentUser();

  if (!user?.id) {
    console.error("[createEdditorsession] No user session found");
    return { success: false as const, reason: "not_authenticated" };
  }

  try {
    // Resolve the real DB user ID (token.sub may be the OAuth provider ID)
    let realUserId = user.id;
    if (user.email) {
      const dbUser = await db.user.findUnique({
        where: { email: user.email },
        select: { id: true },
      });
      if (dbUser) {
        realUserId = dbUser.id;
      } else {
        console.error(
          "[createEdditorsession] User not found in DB for email:",
          user.email,
        );
        return { success: false as const, reason: "user_not_in_db" };
      }
    }

    const edditorSession = await db.edditorSession.create({
      data: {
        title,
        description,
        template,
        userId: realUserId,
      },
    });
    revalidatePath("/dashboard");
    return { success: true as const, data: edditorSession };
  } catch (error) {
    console.error("[createEdditorsession] DB error:", error);
    return { success: false as const, reason: "db_error" };
  }
};

export const getEdditorSessionsForUser = async () => {
  const user = await currentUser();

  if (!user?.id) {
    return [];
  }

  try {
    // First try by user ID (fast path)
    let edditorSessions = await db.edditorSession.findMany({
      where: {
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        starmark: {
          where: {
            userId: user.id,
          },
          select: {
            isMarked: true,
          },
        },
      },
    });

    // Fallback: if no results, the JWT token.sub may be the OAuth provider ID
    // rather than the real MongoDB user ID. Try looking up by email instead.
    if (edditorSessions.length === 0 && user.email) {
      const dbUser = await db.user.findUnique({
        where: { email: user.email },
        select: { id: true },
      });

      if (dbUser && dbUser.id !== user.id) {
        // Found the real DB user – fetch their sessions
        edditorSessions = await db.edditorSession.findMany({
          where: { userId: dbUser.id },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            starmark: {
              where: { userId: dbUser.id },
              select: { isMarked: true },
            },
          },
        });
      }
    }

    // Filter out any sessions with null users (shouldn't happen, but safety check)
    return edditorSessions.filter((session) => session.user !== null);
  } catch (error) {
    console.error("Error fetching Edditor sessions:", error);
    return [];
  }
};

export const deleteEdditorSession = async (id: string) => {
  try {
    await db.edditorSession.delete({
      where: {
        id: id,
      },
    });
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error deleting Edditor session:", error);
    return { error: "Failed to delete project" };
  }
};

export const editprojectById = async (
  id: string,
  data: { title?: string; description?: string },
) => {
  try {
    await db.edditorSession.update({
      where: { id },
      data,
    });
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error updating Edditor session:", error);
    return { error: "Failed to update project" };
  }
};

export const duplicateEdditorSession = async (id: string) => {
  try {
    const originalSession = await db.edditorSession.findUnique({
      where: { id },
    });
    if (!originalSession) {
      return { error: "Original project not found" };
    }

    const duplicatedSession = await db.edditorSession.create({
      data: {
        title: originalSession.title + " (Copy)",
        description: originalSession.description,
        template: originalSession.template,
        userId: originalSession.userId,
      },
    });
    revalidatePath("/dashboard");
    return duplicatedSession;
  } catch (error) {
    console.error("Error duplicating Edditor session:", error);
    return { error: "Failed to duplicate project" };
  }
};
