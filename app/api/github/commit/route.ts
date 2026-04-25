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
      const results: any[] = [];
      const toBase64 = (str: string) =>
        Buffer.from(str || "", "utf-8").toString("base64");

      for (const file of fileList) {
        const encoded = toBase64(file.content);
        let sha: string | undefined;

        const getRes = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/contents/${file.path}`,
          { headers },
        );

        if (getRes.ok) {
          const getData = await getRes.json();
          sha = getData.sha;
        }

        const putRes = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/contents/${file.path}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({
              message: message || "commit from IDE",
              content: encoded,
              ...(sha ? { sha } : {}),
            }),
          },
        );
        const putData = await putRes.json();

        if (!putRes.ok) {
          const putMessage = String(putData?.message || "").toLowerCase();
          if (
            putRes.status === 422 &&
            (putMessage.includes("same") || putMessage.includes("identical"))
          ) {
            results.push({ file: file.path, skipped: true, reason: "no change" });
            continue;
          }

          results.push({
            file: file.path,
            ok: false,
            error: putData?.message || "Failed updating file",
          });
          continue;
        }

        results.push({
          file: file.path,
          ok: true,
          changed: Boolean(putData?.commit?.sha || putData?.content?.sha),
          commitSha: putData?.commit?.sha,
        });
      }

      const committed = results.filter((r) => r.changed).length;
      const skipped = results.filter((r) => r.skipped).length;
      const failed = results.filter((r) => r.ok === false).length;

      return NextResponse.json({
        success: committed > 0 || skipped > 0 || failed === 0,
        totalFiles: fileList.length,
        committedFiles: committed,
        skippedFiles: skipped,
        failedFiles: failed,
        fallback: "contents-api",
        fallbackReason,
        results,
      });
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

      const defaultBranch = repoData.default_branch || "main";

      const refRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/${defaultBranch}`,
        { headers },
      );
      const refData = await refRes.json();

      if (!refRes.ok) {
        commitLock = false;
        return await fallbackContentsCommit(
          refData?.message || "Failed to load branch ref for atomic commit",
        );
      }

      const baseCommitSha = refData.object?.sha;

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

      const baseTreeSha = commitData.tree?.sha;
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
            base_tree: baseTreeSha,
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

      if (treeData.sha === baseTreeSha) {
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
            parents: [baseCommitSha],
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
