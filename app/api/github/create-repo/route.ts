import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { token, name } = await req.json();

    const res = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        name,
        private: false,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      repo: data.full_name,
      url: data.html_url,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
