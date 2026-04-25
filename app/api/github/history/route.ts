import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { token, repo } = await req.json();

    if (!repo || !repo.includes("/")) {
      return NextResponse.json(
        { success: false, commits: [] },
        { status: 400 },
      );
    }

    const [owner, repoName] = repo.split("/");
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    };

    const repoRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}`,
      { headers },
    );
    const repoData = await repoRes.json();

    if (!repoRes.ok) {
      return NextResponse.json({ success: false, commits: [] });
    }

    const defaultBranch = repoData.default_branch || "main";

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=50&sha=${encodeURIComponent(defaultBranch)}`,
      { headers },
    );

    const data = await res.json();

    if (!res.ok || !Array.isArray(data)) {
      return NextResponse.json({ success: false, commits: [] });
    }

    const cleaned = data.map((c: any) => ({
      sha: c.sha,
      message: c.commit?.message || "",
      author: c.commit?.author?.name || "Unknown",
      date: c.commit?.author?.date || "",
    }));

    return NextResponse.json({
      success: true,
      commits: cleaned,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      commits: [],
      error: err.message,
    });
  }
}
