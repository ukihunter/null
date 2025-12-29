"use server";

import { currentUser } from "@/features/auth/actions";
import { TemplateFolder } from "../lib/path-to-jason";
import { db } from "@/lib/db";

export const getEdditorById = async (id: string) => {
  try {
    const editor = await db.edditorSession.findUnique({
      where: { id },
      select: {
        title: true,
        description: true,
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

export const saveUpdatedCode = async (
  edditorSessionId: string,
  data: TemplateFolder
) => {
  const user = await currentUser();
  if (!user) return null;

  try {
    const updatedProject = await db.templatesFile.upsert({
      where: { id: edditorSessionId },
      update: { content: JSON.stringify(data) },
      create: {
        edditorSessionId,
        content: JSON.stringify(data),
      },
    });
    return updatedProject;
  } catch (error) {
    console.error("Error saving updated code:", error);
    throw new Error("Could not save updated code");
  }
};
