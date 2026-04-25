import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, files } = await req.json();

    const token = process.env.GITHUB_TOKEN!;
    const owner = process.env.GITHUB_OWNER!;
    const repo = process.env.GITHUB_REPO!;

    const results: any[] = [];

    const cleanPath = (path: string) =>
      path.replace(/^\/+/, "").replace(/\/+/g, "/");

    const walk = async (node: any, base = "") => {
      if (!node) return;

      // ✅ HANDLE ARRAY ROOT
      if (Array.isArray(node)) {
        for (const item of node) {
          await walk(item, base);
        }
        return;
      }

      // ✅ HANDLE FOLDER
      if (node.items && Array.isArray(node.items)) {
        const folderPath = node.folderName
          ? cleanPath(`${base}/${node.folderName}`)
          : base;

        for (const child of node.items) {
          await walk(child, folderPath);
        }
        return;
      }

      // ✅ HANDLE FILE
      if (node.filename && node.fileExtension) {
        const filePath = cleanPath(
          `${base}/${node.filename}.${node.fileExtension}`,
        );

        try {
          let sha: string | undefined;

          // 1. check if file exists
          const getRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
              },
            },
          );

          if (getRes.ok) {
            const data = await getRes.json();
            sha = data.sha;
          }

          // 2. encode content
          const encoded = Buffer.from(node.content || "").toString("base64");

          // 3. create/update file
          const commitRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message: message || "commit from IDE",
                content: encoded,
                ...(sha ? { sha } : {}),
              }),
            },
          );

          const data = await commitRes.json();

          results.push({
            file: filePath,
            status: commitRes.status,
            ok: commitRes.ok,
            result: data,
          });
        } catch (err: any) {
          results.push({
            file: filePath,
            status: 500,
            ok: false,
            error: err.message,
          });
        }
      }
    };

    await walk(files);

    return NextResponse.json({
      success: true,
      committedFiles: results.length,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
