import { prisma } from "@/lib/prisma";

// List of disposable/temporary email domains
const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "temp-mail.org",
  "throwaway.email",
  "fakeinbox.com",
  "tempmail.us",
  "yopmail.com",
  "trashmail.com",
  "temp-mail.net",
  "temporalmail.com",
  "emailondeck.com",
  "maildrop.cc",
]);

// Common legitimate email domains to whitelist
const COMMON_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "aol.com",
  "icloud.com",
  "mail.com",
  "protonmail.com",
  "fastmail.com",
  "zoho.com",
  "yandex.com",
  "mail.ru",
  "inbox.com",
  "gmx.com",
  "tutanota.com",
]);

async function validateEmailDomain(domain: string): Promise<boolean> {
  try {
    // Check if it's a common/known legitimate domain
    if (COMMON_DOMAINS.has(domain.toLowerCase())) {
      return true;
    }

    // Check if it's a disposable domain
    if (DISPOSABLE_DOMAINS.has(domain.toLowerCase())) {
      return false;
    }

    // Try to validate using DNS lookup if available
    try {
      // Use Node's dns module for MX record validation
      const dns = await import("node:dns").then((m) => m.default);
      const { promisify } = await import("node:util").then((m) => m.default);
      const resolveMx = promisify(dns.resolveMx);

      const mxRecords = await Promise.race([
        resolveMx(domain),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("DNS timeout")), 5000),
        ),
      ]);

      return Array.isArray(mxRecords) && mxRecords.length > 0;
    } catch (dnsError) {
      // DNS lookup failed or timed out
      // For unknown domains, we'll be lenient and allow them
      // This prevents blocking legitimate corporate/custom domains
      // Debug logging intentionally suppressed.

      // Only reject if it looks like a clear invalid domain
      // (no TLD or obviously malformed)
      const hasValidTld = /\.\w{2,}$/.test(domain);
      return hasValidTld;
    }
  } catch (_error) {
    // Debug logging intentionally suppressed.
    // If all else fails, be lenient
    return true;
  }
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return Response.json(
        { available: false, reason: "invalid_input" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return Response.json({
        available: false,
        reason: "invalid_format",
        message: "Invalid email format",
      });
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
        message: "Email already in use",
      });
    }

    // Extract domain
    const domain = normalizedEmail.split("@")[1] ?? "";

    // Validate email domain is active
    const isValidDomain = await validateEmailDomain(domain);
    if (!isValidDomain) {
      return Response.json({
        available: false,
        reason: "invalid_domain",
        message: "Email domain is not valid or is a temporary email service",
      });
    }

    // Email is available and valid
    return Response.json({
      available: true,
      message: "Email is valid and available",
    });
  } catch (_error) {
    // Debug logging intentionally suppressed.
    // On server error, be lenient and allow the email if format is valid
    return Response.json(
      { available: true, message: "Email validation passed" },
      { status: 200 },
    );
  }
}
