"use server";

//import { deeEdditorSession } from "./index";

import { currentUser } from "@/features/auth/actions";
import { db } from "@/lib/db";
import type { Templates } from "@prisma/client";
//import { ca } from "date-fns/locale";
import { revalidatePath } from "next/cache";
import type {
  TemplateFile,
  TemplateFolder,
} from "@/features/edditor/lib/path-to-jason";

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

// ---------------------------------------------------------------------------
// GitHub repo import
// ---------------------------------------------------------------------------

const TEXT_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "cts",
  "mts",
  "html",
  "css",
  "scss",
  "sass",
  "less",
  "json",
  "md",
  "mdx",
  "txt",
  "yaml",
  "yml",
  "toml",
  "ini",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "kt",
  "php",
  "cs",
  "sh",
  "bash",
  "zsh",
  "fish",
  "ps1",
  "xml",
  "svg",
  "vue",
  "svelte",
  "prisma",
  "graphql",
  "gql",
  "env",
  "example",
  "lock",
  "prettierrc",
  "eslintrc",
]);

const IGNORE_FOLDERS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".nuxt",
  "coverage",
  ".turbo",
  ".cache",
  "out",
]);

function buildTree(
  filePaths: Map<string, string>,
  rootName: string,
): TemplateFolder {
  const root: TemplateFolder = { folderName: rootName, items: [] };

  for (const [filePath, content] of filePaths) {
    const parts = filePath.split("/");
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i];
      let folder = current.items.find(
        (item): item is TemplateFolder =>
          "folderName" in item && item.folderName === folderName,
      );
      if (!folder) {
        folder = { folderName, items: [] };
        current.items.push(folder);
      }
      current = folder;
    }

    const filename = parts[parts.length - 1];
    const dotIndex = filename.lastIndexOf(".");
    const fileExtension = dotIndex >= 0 ? filename.slice(dotIndex + 1) : "";
    const file: TemplateFile = { filename, fileExtension, content };
    current.items.push(file);
  }

  return root;
}

export const importGithubRepo = async (githubUrl: string) => {
  const user = await currentUser();
  if (!user?.id)
    return { success: false as const, reason: "not_authenticated" };

  // Resolve real DB user ID
  let realUserId = user.id;
  if (user.email) {
    const dbUser = await db.user.findUnique({
      where: { email: user.email },
      select: { id: true },
    });
    if (dbUser) realUserId = dbUser.id;
    else return { success: false as const, reason: "user_not_in_db" };
  }

  // Parse GitHub URL: https://github.com/owner/repo[/tree/branch]
  const match = githubUrl
    .trim()
    .match(
      /github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?:\/tree\/([^/?# ]+))?/,
    );
  if (!match) return { success: false as const, reason: "invalid_url" };

  const owner = match[1];
  const repoName = match[2].replace(/\.git$/, "");
  const ref = match[3] || "HEAD";

  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "null-editor",
    ...(process.env.GITHUB_TOKEN
      ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
      : {}),
  };

  // 1. Fetch recursive file tree (1 API call)
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/git/trees/${ref}?recursive=1`,
    { headers },
  );

  if (!treeRes.ok) {
    if (treeRes.status === 404)
      return { success: false as const, reason: "repo_not_found" };
    if (treeRes.status === 403 || treeRes.status === 429)
      return { success: false as const, reason: "rate_limited" };
    return { success: false as const, reason: "github_error" };
  }

  const treeData = await treeRes.json();

  type TreeItem = { path: string; type: string; size: number; sha: string };

  // 2. Filter to text blobs only, skip ignored folders, cap at 100 files
  const blobs: TreeItem[] = (treeData.tree as TreeItem[])
    .filter((item) => {
      if (item.type !== "blob") return false;
      if (item.size > 300_000) return false; // skip > 300 KB

      const parts = item.path.split("/");
      if (parts.some((p) => IGNORE_FOLDERS.has(p))) return false;

      const filename = parts[parts.length - 1].toLowerCase();
      const ext = filename.includes(".")
        ? (filename.split(".").pop() ?? "")
        : "";

      // Always include known config files with no extension
      const noExtAllowlist = new Set([
        "dockerfile",
        "makefile",
        ".gitignore",
        ".env.example",
      ]);

      return TEXT_EXTENSIONS.has(ext) || noExtAllowlist.has(filename);
    })
    .slice(0, 100);

  // 3. Fetch blob contents in parallel (batches of 10 to stay within rate limits)
  const fileContents = new Map<string, string>();

  for (let i = 0; i < blobs.length; i += 10) {
    const chunk = blobs.slice(i, i + 10);
    const results = await Promise.all(
      chunk.map(async (item) => {
        try {
          const res = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/git/blobs/${item.sha}`,
            { headers },
          );
          if (!res.ok) return null;
          const data = await res.json();
          if (data.encoding !== "base64") return null;
          const decoded = Buffer.from(
            data.content.replace(/\n/g, ""),
            "base64",
          ).toString("utf-8");
          return { path: item.path, content: decoded };
        } catch {
          return null;
        }
      }),
    );
    for (const r of results) {
      if (r) fileContents.set(r.path, r.content);
    }
  }

  if (fileContents.size === 0) {
    return { success: false as const, reason: "no_files_found" };
  }

  // 4. Build TemplateFolder tree
  const tree = buildTree(fileContents, repoName);

  // 5. Create EditorSession + TemplatesFile in one transaction
  try {
    const session = await db.edditorSession.create({
      data: {
        title: repoName,
        description: `Imported from github.com/${owner}/${repoName}`,
        template: "REACTJS",
        userId: realUserId,
        templateFiles: {
          create: {
            content: JSON.stringify(tree),
          },
        },
      },
    });

    revalidatePath("/dashboard");
    return { success: true as const, data: { id: session.id } };
  } catch (error) {
    console.error("[importGithubRepo] DB error:", error);
    return { success: false as const, reason: "db_error" };
  }
};

export const toggleProjectStar = async (edditorSessionId: string) => {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return { error: "Not authenticated" };
    }

    // Resolve real DB user ID
    let realUserId = user.id;
    if (user.email) {
      const dbUser = await db.user.findUnique({
        where: { email: user.email },
        select: { id: true },
      });
      if (dbUser) {
        realUserId = dbUser.id;
      }
    }

    // Check if star mark already exists
    const existingStar = await db.starMark.findUnique({
      where: {
        userId_edditorSessionId: {
          userId: realUserId,
          edditorSessionId: edditorSessionId,
        },
      },
    });

    if (existingStar) {
      // Toggle the isMarked flag
      const updatedStar = await db.starMark.update({
        where: {
          userId_edditorSessionId: {
            userId: realUserId,
            edditorSessionId: edditorSessionId,
          },
        },
        data: {
          isMarked: !existingStar.isMarked,
        },
      });
      revalidatePath("/dashboard");
      return { success: true, isMarked: updatedStar.isMarked };
    } else {
      // Create new star mark
      const newStar = await db.starMark.create({
        data: {
          userId: realUserId,
          edditorSessionId: edditorSessionId,
          isMarked: true,
        },
      });
      revalidatePath("/dashboard");
      return { success: true, isMarked: newStar.isMarked };
    }
  } catch (error) {
    console.error("[toggleProjectStar] Error:", error);
    return { error: "Failed to toggle star" };
  }
};
