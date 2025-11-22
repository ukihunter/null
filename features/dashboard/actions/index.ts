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
    throw new Error("User not authenticated");
  }

  try {
    const edditorSession = await db.edditorSession.create({
      data: {
        title,
        description,
        template,
        userId: user.id,
      },
    });

    return edditorSession;
  } catch (error) {
    console.error("Error creating Edditor session:", error);
    throw error;
  }
};

export const getEdditorSessionsForUser = async () => {
  const user = await currentUser();

  if (!user?.id) {
    return [];
  }

  try {
    const edditorSessions = await db.edditorSession.findMany({
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

    // Filter out any sessions with null users (shouldn't happen, but safety check)
    return edditorSessions.filter((session) => session.user !== null);
  } catch (error) {
    console.error("Error fetching Edditor sessions:", error);
    throw error;
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
    throw error;
  }
};

export const editprojectById = async (
  id: string,
  data: { title?: string; description?: string }
) => {
  try {
    await db.edditorSession.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error("Error updating Edditor session:", error);
    throw error;
  }
};

export const duplicateEdditorSession = async (id: string) => {
  try {
    const originalSession = await db.edditorSession.findUnique({
      where: { id },
    });
    if (!originalSession) {
      throw new Error("Original Edditor session not found");
    }

    const duplicatedSession = await db.edditorSession.create({
      data: {
        title: originalSession.title + " (Copy)",
        description: originalSession.description,
        template: originalSession.template,
        userId: originalSession.userId,
      },
    });
    return duplicatedSession;
  } catch (error) {
    console.error("Error duplicating Edditor session:", error);
    throw error;
  }
};
