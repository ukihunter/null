import { templatePaths } from "./../../../../lib/tempalte";
import {
  readTemplateStructureFromJson,
  saveTemplateStructureToJson,
} from "@/features/edditor/lib/path-to-jason";
import { db } from "@/lib/db";
import path from "path";
import fs from "fs/promises";
import { NextRequest } from "next/server";

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
    console.error(`Invalid template type: ${editor.template}`);
    return new Response(`Invalid template type: ${editor.template}`, { status: 400 });
  }

  try {
    const inputPath = path.join(process.cwd(), templatePath);
    const tempDir = path.join(process.cwd(), "temp");
    const outputFile = path.join(tempDir, `${id}.json`);
    
    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true });
    
    console.log(`Processing template: ${templateKey} from ${inputPath}`);
    
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
    console.error("Error processing template:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(`Error processing template: ${errorMessage}`, { status: 500 });
  }
}
