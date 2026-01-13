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
    console.log("Saving to database for session:", edditorSessionId);

    // Find existing template file for this session
    const existing = await db.templatesFile.findFirst({
      where: { edditorSessionId },
    });

    let updatedProject;
    if (existing) {
      // Update existing record
      updatedProject = await db.templatesFile.update({
        where: { id: existing.id },
        data: { content: JSON.stringify(data) },
      });
      console.log("Database update successful");
    } else {
      // Create new record
      updatedProject = await db.templatesFile.create({
        data: {
          edditorSessionId,
          content: JSON.stringify(data),
        },
      });
      console.log("Database create successful");
    }

    return updatedProject;
  } catch (error) {
    console.error("Error saving updated code:", error);
    throw new Error("Could not save updated code");
  }
};
