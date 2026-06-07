"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut, Shield, X } from "lucide-react";
import { useState } from "react";
import type { ExistingFeedback } from "./FeedbackForm";
import { FeedbackForm } from "./FeedbackForm";

interface FeedbackModalProps {
  enrollmentId?: string;
  classId?: string | null;
  existingFeedback?: ExistingFeedback | null;
  shouldShowModal?: boolean;
}

export function FeedbackModal({
  enrollmentId,
  classId,
  existingFeedback,
  shouldShowModal = true,
}: FeedbackModalProps) {
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);

  function handleSignOutClick() {
    if (enrollmentId && classId && shouldShowModal) {
      setOpen(true);
    } else {
      signOut({ redirectUrl: "/sign-in" });
    }
  }

  function handleSkip() {
    signOut({ redirectUrl: "/sign-in" });
  }

  function handleSuccess() {
    signOut({ redirectUrl: "/sign-in" });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleSignOutClick}
        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-medium text-gray-500 text-sm transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
      >
        <LogOut size={17} />
        Sign Out
      </button>

      {open && enrollmentId && classId && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Skip feedback and sign out"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleSkip}
          />

          <div className="relative flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl duration-300 animate-in slide-in-from-bottom-4 dark:bg-gray-900 sm:mx-4 sm:max-w-2xl sm:rounded-3xl">
            <div className="flex-shrink-0 border-b p-5 dark:border-gray-700">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h2 className="font-black text-gray-900 text-lg dark:text-white">
                    Before you go... 👋
                  </h2>
                  <p className="mt-0.5 text-gray-500 text-sm dark:text-gray-400">
                    Share your experience — it takes just a moment
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-shrink-0 rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-center gap-2.5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2.5 dark:border-blue-800 dark:bg-blue-900/20">
                <Shield size={15} className="flex-shrink-0 text-blue-500" />
                <p className="font-medium text-blue-700 text-xs dark:text-blue-300">
                  Feel free to submit feedback — it is visible to support teams
                  only and kept confidential.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <FeedbackForm
                enrollmentId={enrollmentId}
                classId={classId}
                existingFeedback={existingFeedback}
                onSuccess={handleSuccess}
                compact={true}
                fromModal={true}
              />
            </div>

            <div className="flex-shrink-0 border-t p-4 text-center dark:border-gray-700">
              <button
                type="button"
                onClick={handleSkip}
                className="text-gray-400 text-sm transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              >
                Skip & Sign Out without saving
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
