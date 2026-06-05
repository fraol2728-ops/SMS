import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return Response.json({ available: false }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return Response.json({ available: false, reason: "invalid_format" });
    }

    // Check if email already exists in the system
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return Response.json({
        available: false,
        reason: "email_already_exists",
      });
    }

    // Email is available
    return Response.json({ available: true });
  } catch (error) {
    console.error("Error checking email:", error);
    return Response.json(
      { available: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
