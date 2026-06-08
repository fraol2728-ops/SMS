import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const campusId = searchParams.get("campusId");
    const upcoming = searchParams.get("upcoming");
    const requestedLimit = Number(searchParams.get("limit") ?? 20);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(requestedLimit, 100)
      : 20;

    const now = new Date();

    const events = await prisma.event.findMany({
      where: {
        isActive: true,
        ...(campusId ? { campusId } : {}),
        ...(upcoming === "true" ? { date: { gte: now } } : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        date: true,
        time: true,
        location: true,
        targetAll: true,
        campus: { select: { id: true, name: true } },
        createdAt: true,
      },
      orderBy: { date: "asc" },
      take: limit,
    });

    return NextResponse.json(
      {
        success: true,
        count: events.length,
        data: events,
      },
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (_e) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch events" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: corsHeaders,
    },
  );
}
