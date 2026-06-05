"use client";

import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";

type EmailValidationStatus = "idle" | "validating" | "valid" | "invalid";

export function EmailValidationInput({
  id,
  name,
  placeholder,
  defaultValue = "",
}: {
  id: string;
  name: string;
  placeholder: string;
  defaultValue?: string;
}) {
  const [email, setEmail] = useState(defaultValue);
  const [status, setStatus] = useState<EmailValidationStatus>("idle");
  const [touched, setTouched] = useState(false);

  // Validate email format
  const isValidEmailFormat = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if email is already in use (for registration)
  useEffect(() => {
    if (!email.trim()) {
      setStatus("idle");
      return;
    }

    if (!isValidEmailFormat(email)) {
      setStatus("invalid");
      return;
    }

    // Set to validating
    setStatus("validating");

    // Simulate API call to check if email exists (in reality you'd call a server action)
    const checkEmail = async () => {
      try {
        const response = await fetch("/api/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase() }),
        });

        const data = await response.json();

        if (data.available) {
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch (error) {
        console.error("Error checking email:", error);
        // If API fails, still allow the form to be submitted if format is valid
        setStatus("valid");
      }
    };

    // Debounce the check
    const timer = setTimeout(checkEmail, 500);
    return () => clearTimeout(timer);
  }, [email]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          id={id}
          name={name}
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          className="w-full rounded-md border border-gray-300 bg-background px-3 py-2 pr-10 text-sm placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900"
        />

        {/* Validation Icon */}
        {touched && email && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {status === "validating" && (
              <div className="animate-spin">
                <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-blue-500" />
              </div>
            )}
            {status === "valid" && (
              <div className="flex items-center justify-center">
                <Check className="h-5 w-5 text-green-500" />
              </div>
            )}
            {status === "invalid" && (
              <div className="flex items-center justify-center">
                <X className="h-5 w-5 text-red-500" />
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {!email
          ? "If no email provided, a system email will be generated automatically."
          : status === "valid"
            ? "✓ Email is available"
            : status === "invalid"
              ? "✗ Email is invalid or already in use"
              : "Checking email..."}
      </p>
    </div>
  );
}
