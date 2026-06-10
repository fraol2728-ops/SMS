'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <h1 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-white">
              Something went wrong
            </h1>

            <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
              An unexpected error has occurred. Please try again or contact support if the problem persists.
            </p>

            {process.env.NODE_ENV === 'development' && error.message && (
              <div className="mb-6 rounded-lg bg-red-50 p-4 dark:bg-red-900">
                <p className="font-mono text-sm text-red-800 dark:text-red-200">
                  {error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => reset()}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                Try again
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                variant="outline"
                className="w-full"
              >
                Go home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
