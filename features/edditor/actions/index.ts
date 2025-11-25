"use server";

import { db } from "@/lib/db";

export const getEdditorById = async (id: string) => {
  try {
    const editor = await db.edditorSession.findUnique({
      where: { id },
      select: {
        templateFiles: {
          select: { content: true },
        },
        id: true,
      },
    });
    return editor;
  } catch (error) {
    console.error("Error fetching edditor:", error);
    throw new Error("Could not fetch edditor");
  }
};
