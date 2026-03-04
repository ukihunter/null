import { auth } from "@/auth";
import pusherServer from "@/lib/pusher";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.text();
  const params = new URLSearchParams(data);
  const socketId = params.get("socket_id");
  const channelName = params.get("channel_name");

  if (!socketId || !channelName) {
    return NextResponse.json(
      { error: "Missing socket_id or channel_name" },
      { status: 400 },
    );
  }

  const authData = pusherServer.authorizeChannel(socketId, channelName, {
    user_id: session.user.id,
    user_info: {
      name: session.user.name ?? "Anonymous",
      image: session.user.image ?? null,
      email: session.user.email ?? null,
    },
  });

  return NextResponse.json(authData);
}
