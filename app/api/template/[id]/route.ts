import { templatePaths } from "./../../../../lib/tempalte";
import {
  readTemplateStructureFromJson,
  saveTemplateStructureToJson,
} from "@/features/edditor/lib/path-to-jason";
import { db } from "@/lib/db";
import path from "path";
import fs from "fs/promises";
import { NextRequest } from "next/server";
import { ca } from "date-fns/locale";

function validateJsonStructure(data: unknown): boolean {
  try {
    JSON.parse(JSON.stringify(data)); // Ensures it's serializable
    return true;
  } catch (error) {
    console.error("Invalid JSON structure:", error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return new Response("Template ID is required", { status: 400 });
  }

  const editor = await db.edditorSession.findUnique({
    where: { id },
    include: { templateFiles: true },
  });

  if (!editor) {
    return new Response("Editor not found", { status: 404 });
  }

  const templateKey = editor.template as keyof typeof templatePaths;
  const templatePath = templatePaths[templateKey];

  if (!templatePath) {
    return new Response("Invalid template type", { status: 400 });
  }

  try {
    const inputPath = path.join(process.cwd(), templatePath);
    const outputFile = path.join(process.cwd(), "temp", `${id}.json`);
    await saveTemplateStructureToJson(inputPath, outputFile);
    const result = await readTemplateStructureFromJson(outputFile);
    if (!validateJsonStructure(result.items)) {
      return new Response("Invalid template structure", { status: 500 });
    }
    await fs.unlink(outputFile);
    return Response.json(
      { success: true, templateJson: result },
      { status: 200 }
    );
  } catch (error) {
    return new Response("Error processing template", { status: 500 });
  }
}
