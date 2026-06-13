import type { NextConfig } from "next";

// Validate required environment variables at build time
function validateEnv() {
  const required = [
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "DATABASE_URL",
  ];

  const missing = required.filter((env) => !process.env[env]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        `Please check your .env.local file.`
    );
  }
}

// Only validate in production builds
if (process.env.NODE_ENV === "production") {
  validateEnv();
}

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["html5-qrcode"],
  env: {
    NEXT_PUBLIC_CLERK_SIGN_IN_URL:
      process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in",
    NEXT_PUBLIC_CLERK_SIGN_UP_URL:
      process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up",
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL:
      process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL ?? "/",
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL:
      process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL ?? "/",
  },
  reactCompiler: true,
  async headers() {
    return [
      {
        source: "/:path((?!api).*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
