import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
            <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-white">
          Page not found
        </h1>

        <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
          The page you're looking for doesn't exist or has been moved. Please check the URL and try again.
        </p>

        <div className="flex flex-col gap-3">
          <Link href="/">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
              Go home
            </Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline" className="w-full">
              Go to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
