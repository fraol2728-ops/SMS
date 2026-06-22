import { NextResponse } from "next/server";
import { publishToTelegram } from "@/lib/actions/telegram";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET)
    return new Response("Server misconfiguration", { status: 500 });

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`)
    return new NextResponse("Unauthorized", { status: 401 });

  const duePosts = await prisma.scheduledPost.findMany({
    where: { status: "SCHEDULED", scheduledFor: { lte: new Date() } },
  });
  const results = [];
  for (const post of duePosts) {
    const result = await publishToTelegram(
      post.channelId,
      post.content,
      post.imageUrl ?? undefined,
    );
    if (result.success) {
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });
      results.push({ id: post.id, status: "published" });
    } else {
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: { status: "FAILED", errorMessage: result.error },
      });
      results.push({ id: post.id, status: "failed", error: result.error });
    }
  }
  return NextResponse.json({ processed: results.length, results });
}
