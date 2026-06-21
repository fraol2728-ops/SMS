"use client";

import { AlertCircle, Check, X } from "lucide-react";
import { useEffect, useState } from "react";

type EmailValidationStatus = "idle" | "validating" | "valid" | "invalid";

type ValidationReason =
  | "invalid_format"
  | "email_already_exists"
  | "invalid_domain"
  | "server_error";

const reasonMessages: Record<ValidationReason, string> = {
  invalid_format: "Invalid email format",
  email_already_exists: "Email already in use",
  invalid_domain: "Email domain is not active",
  server_error: "Error checking email",
};

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
  const [reason, setReason] = useState<ValidationReason | null>(null);

  // Check if email is valid and active
  useEffect(() => {
    if (!email.trim()) {
      setStatus("idle");
      setReason(null);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("invalid");
      setReason("invalid_format");
      return;
    }

    // Set to validating
    setStatus("validating");

    // Validate email with server
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
          setReason(null);
        } else {
          setStatus("invalid");
          setReason(data.reason || null);
        }
      } catch (_error) {
        // Debug logging intentionally suppressed.
        // If API fails, still allow the form to be submitted if format is valid
        setStatus("valid");
        setReason(null);
      }
    };

    // Debounce the check
    const timer = setTimeout(checkEmail, 500);
    return () => clearTimeout(timer);
  }, [email]);

  const getStatusMessage = () => {
    if (!email) {
      return "If no email provided, a system email will be generated automatically.";
    }

    switch (status) {
      case "validating":
        return "Validating email...";
      case "valid":
        return "✓ Email is valid and available";
      case "invalid":
        return `✗ ${reason ? reasonMessages[reason] : "Email is not valid or available"}`;
      default:
        return "If no email provided, a system email will be generated automatically.";
    }
  };

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
                {reason === "invalid_domain" ? (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                ) : (
                  <X className="h-5 w-5 text-red-500" />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <p
        className={`text-xs ${
          status === "valid"
            ? "text-green-600 dark:text-green-400"
            : status === "invalid" && reason === "invalid_domain"
              ? "text-orange-600 dark:text-orange-400"
              : status === "invalid"
                ? "text-red-600 dark:text-red-400"
                : "text-muted-foreground"
        }`}
      >
        {getStatusMessage()}
      </p>
    </div>
  );
}
