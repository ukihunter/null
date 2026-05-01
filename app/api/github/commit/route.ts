import { NextResponse } from "next/server";

let commitLock = false;

export async function POST(req: Request) {
  try {
    const { message, files, token, repo, unsavedFiles } = await req.json();

    if (commitLock) {
      return NextResponse.json({
        success: false,
        message: "Commit already in progress",
      });
    }

    commitLock = true;

    const githubToken = token || process.env.GITHUB_TOKEN;
    const targetRepo = repo || `${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`;

    if (!githubToken) {
      commitLock = false;
      return NextResponse.json(
        { success: false, error: "Missing GitHub token" },
        { status: 400 },
      );
    }

    if (!targetRepo || !targetRepo.includes("/")) {
      commitLock = false;
      return NextResponse.json(
        { success: false, error: "Invalid repo format. Use owner/repo" },
        { status: 400 },
      );
    }

    const [owner, repoName] = targetRepo.split("/");

    const cleanPath = (p: string) => p.replace(/^\/+/, "").replace(/\/+/g, "/");

    const flattenFiles = (node: any, base = "", acc: Array<{ path: string; content: string }> = []) => {
      if (!node) return acc;

      if (Array.isArray(node)) {
        for (const item of node) flattenFiles(item, base, acc);
        return acc;
      }

      if (node.items && Array.isArray(node.items)) {
        const folderPath = node.folderName
          ? cleanPath(`${base}/${node.folderName}`)
          : base;

        for (const child of node.items) {
          flattenFiles(child, folderPath, acc);
        }
        return acc;
      }

      if (node.filename && node.fileExtension) {
        acc.push({
          path: cleanPath(`${base}/${node.filename}.${node.fileExtension}`),
          content: node.content || "",
        });
      }
      return acc;
    };

    const sourceList = flattenFiles(files);
    const dedupedByPath = new Map<string, { path: string; content: string }>();
    for (const item of sourceList) dedupedByPath.set(item.path, item);
    const fileList = Array.from(dedupedByPath.values());

    if (fileList.length === 0) {
      commitLock = false;
      return NextResponse.json({
        success: true,
        committedFiles: 0,
        skippedFiles: 0,
        results: [],
      });
    }

    const headers = {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    };
    const fallbackContentsCommit = async (fallbackReason: string) => {
      // We removed the file-by-file contents fallback because it creates a separate
      // commit for every single file. We will instead throw an error to the user
      // if the atomic commit flow fails, so they know exactly what went wrong.
      commitLock = false;
      return NextResponse.json(
        { success: false, error: fallbackReason || "Atomic commit failed. Please try again." },
        { status: 500 }
      );
    };

    try {
      const repoRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}`,
        { headers },
      );
      const repoData = await repoRes.json();

      if (!repoRes.ok) {
        commitLock = false;
        return NextResponse.json(
          { success: false, error: repoData?.message || "Failed to load repository" },
          { status: repoRes.status },
        );
      }

      if (!repoData.permissions?.push) {
        commitLock = false;
        return NextResponse.json(
          { success: false, error: "You do not have push access to this repository. You can only commit to your own repositories." },
          { status: 403 },
        );
      }

      const defaultBranch = repoData.default_branch || "main";

      const refRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/${defaultBranch}`,
        { headers },
      );
      const refData = await refRes.json();
      
      const isEmptyRepo = !refRes.ok;

      let baseCommitSha: string | undefined;
      let baseTreeSha: string | undefined;

      if (!isEmptyRepo) {
        baseCommitSha = refData.object?.sha;

        const commitRes = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/git/commits/${baseCommitSha}`,
          { headers },
        );
        const commitData = await commitRes.json();

        if (!commitRes.ok) {
          commitLock = false;
          return await fallbackContentsCommit(
            commitData?.message || "Failed to load base commit for atomic commit",
          );
        }

        baseTreeSha = commitData.tree?.sha;
      }

      const treeEntries: Array<{
        path: string;
        mode: string;
        type: string;
        sha: string;
      }> = [];

      for (const file of fileList) {
        const blobRes = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/git/blobs`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              content: file.content,
              encoding: "utf-8",
            }),
          },
        );
        const blobData = await blobRes.json();

        if (!blobRes.ok) {
          commitLock = false;
          return await fallbackContentsCommit(
            blobData?.message || `Failed creating blob for ${file.path}`,
          );
        }

        treeEntries.push({
          path: file.path,
          mode: "100644",
          type: "blob",
          sha: blobData.sha,
        });
      }

      const treeRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/trees`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...(baseTreeSha ? { base_tree: baseTreeSha } : {}),
            tree: treeEntries,
          }),
        },
      );
      const treeData = await treeRes.json();

      if (!treeRes.ok) {
        commitLock = false;
        return await fallbackContentsCommit(
          treeData?.message || "Failed to create tree for atomic commit",
        );
      }

      if (baseTreeSha && treeData.sha === baseTreeSha) {
        commitLock = false;
        return NextResponse.json({
          success: true,
          committedFiles: 0,
          skippedFiles: fileList.length,
          results: fileList.map((f) => ({
            file: f.path,
            skipped: true,
            reason: "no change",
          })),
        });
      }

      const newCommitRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/commits`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: message || "commit from IDE",
            tree: treeData.sha,
            ...(baseCommitSha ? { parents: [baseCommitSha] } : {}),
          }),
        },
      );
      const newCommitData = await newCommitRes.json();

      if (!newCommitRes.ok) {
        commitLock = false;
        return await fallbackContentsCommit(
          newCommitData?.message || "Failed to create atomic commit",
        );
      }

      if (isEmptyRepo) {
        const createRefRes = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/git/refs`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              ref: `refs/heads/${defaultBranch}`,
              sha: newCommitData.sha,
            }),
          },
        );
        const createRefData = await createRefRes.json();

        if (!createRefRes.ok) {
          commitLock = false;
          return await fallbackContentsCommit(
            createRefData?.message || "Failed to create branch ref for atomic commit",
          );
        }
      } else {
        const updateRefRes = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${defaultBranch}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({
              sha: newCommitData.sha,
              force: false,
            }),
          },
        );
        const updateRefData = await updateRefRes.json();

        if (!updateRefRes.ok) {
          commitLock = false;
          return await fallbackContentsCommit(
            updateRefData?.message || "Failed to update branch ref for atomic commit",
          );
        }
      }

      commitLock = false;

      return NextResponse.json({
        success: true,
        committedFiles: fileList.length,
        skippedFiles: 0,
        commitSha: newCommitData.sha,
        branch: defaultBranch,
        repo: `${owner}/${repoName}`,
        results: fileList.map((f) => ({ file: f.path, ok: true, changed: true })),
      });
    } catch (atomicErr: any) {
      commitLock = false;
      return await fallbackContentsCommit(
        atomicErr?.message || "Atomic commit flow failed",
      );
    }
  } catch (err: any) {
    commitLock = false;

    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
