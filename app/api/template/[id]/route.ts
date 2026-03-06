import { templatePaths } from "./../../../../lib/tempalte";
import {
  scanTemplateDirectory,
} from "@/features/edditor/lib/path-to-jason";
import { db } from "@/lib/db";
import path from "path";
import { NextRequest } from "next/server";

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
    return new Response(`Invalid template type: ${editor.template}`, {
      status: 400,
    });
  }

  try {
    const inputPath = path.join(process.cwd(), templatePath);
    console.log(`Processing template: ${templateKey} from ${inputPath}`);

    // Scan directly — no temp file, works on Vercel read-only filesystem
    const result = await scanTemplateDirectory(inputPath);

    return Response.json(
      { success: true, templateJson: result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing template:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(`Error processing template: ${errorMessage}`, {
      status: 500,
    });
  }
}
