import { NextRequest, NextResponse } from "next/server";
import { deleteTeacher } from "@/lib/actions/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body as { id?: string };
    if (!id) {
      return NextResponse.json({ success: false, error: "Teacher id is required." }, { status: 400 });
    }
    const result = await deleteTeacher(id);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to delete teacher." }, { status: 500 });
  }
}
