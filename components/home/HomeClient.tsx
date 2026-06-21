"use client";

import { SignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { ExceedLogo } from "@/components/brand/ExceedLogo";

const ANIMATED_WORDS = [
  "Students",
  "Teachers",
  "Classes",
  "Progress",
  "Success",
  "Excellence",
];

const GRADIENT_COLORS = [
  "from-blue-600 via-purple-600 to-indigo-600",
  "from-purple-600 via-pink-600 to-rose-600",
  "from-indigo-600 via-blue-600 to-cyan-600",
  "from-teal-600 via-green-600 to-emerald-600",
  "from-orange-600 via-amber-600 to-yellow-600",
  "from-rose-600 via-red-600 to-orange-600",
];

export function HomeClient() {
  const [wordIndex, setWordIndex] = useState(0);
  const [gradientIndex, setGradientIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % ANIMATED_WORDS.length);
        setGradientIndex((prev) => (prev + 1) % GRADIENT_COLORS.length);
        setIsVisible(true);
      }, 400);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-gray-950 overflow-hidden">
      {/* Left side — Welcome */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 py-12 lg:py-0 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${GRADIENT_COLORS[gradientIndex]} transition-all duration-1000`}
          />
          <div
            className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20 bg-gradient-to-tl ${GRADIENT_COLORS[(gradientIndex + 2) % GRADIENT_COLORS.length]} transition-all duration-1000`}
          />
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-10 bg-gradient-to-r ${GRADIENT_COLORS[(gradientIndex + 4) % GRADIENT_COLORS.length]} transition-all duration-1000`}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-xl">
          <div className="mb-8">
            <ExceedLogo
              priority
              imageClassName="max-h-14 max-w-[220px] sm:max-h-16 sm:max-w-[260px]"
            />
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-4">
            Manage Your
            <span className="block mt-1">
              <span
                className={`bg-gradient-to-r ${GRADIENT_COLORS[gradientIndex]} bg-clip-text text-transparent transition-all duration-500 inline-block ${
                  isVisible && mounted
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2"
                }`}
                style={{ transition: "opacity 0.4s ease, transform 0.4s ease" }}
              >
                {ANIMATED_WORDS[wordIndex]}
              </span>
            </span>
            <span className="block text-gray-900 dark:text-white">
              Effortlessly
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            A complete management system for Exceed Training Center. Track
            students, classes, attendance, and payments — all in one place.
          </p>

          {/* Feature pills */}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "2", label: "Campuses" },
              { value: "10+", label: "Labs" },
              { value: "∞", label: "Possibilities" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border dark:border-gray-700"
              >
                <p
                  className={`text-2xl sm:text-3xl font-black bg-gradient-to-r ${GRADIENT_COLORS[gradientIndex]} bg-clip-text text-transparent transition-all duration-1000`}
                >
                  {value}
                </p>
                <p className="text-xs text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Divider — visible on desktop */}
      <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-gray-200 dark:via-gray-700 to-transparent flex-shrink-0" />

      {/* Right side — Sign In */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 py-12 lg:py-0 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="w-full max-w-md">
          {/* Sign in header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Sign in with the email provided by your administrator
            </p>
          </div>

          {/* Clerk SignIn component */}
          <div className="flex justify-center">
            <SignIn
              routing="hash"
              appearance={{
                variables: {
                  colorPrimary: "#2563eb",
                  colorBackground: "transparent",
                  colorText: "#111827",
                  colorTextSecondary: "#6b7280",
                  colorInputBackground: "#ffffff",
                  colorInputText: "#111827",
                  borderRadius: "0.75rem",
                  fontFamily: "inherit",
                },
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 p-6 sm:p-8",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton:
                    "border dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                  formFieldInput:
                    "rounded-xl border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500",
                  formButtonPrimary: `rounded-xl font-semibold bg-gradient-to-r ${GRADIENT_COLORS[0]} hover:opacity-90 transition-opacity`,
                  footerActionLink: "text-blue-600 hover:text-blue-800",
                  dividerLine: "dark:bg-gray-700",
                  dividerText: "dark:text-gray-400",
                },
              }}
            />
          </div>

          {/* Bottom note */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Don&apos;t have an account?{" "}
            <span className="text-blue-600">
              Contact your administrator to get invited.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
