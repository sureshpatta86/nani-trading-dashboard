"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 text-center">
            <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Critical Error
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              A critical error has occurred. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === "development" && (
              <div className="mb-6 rounded-lg bg-gray-100 dark:bg-gray-700 p-3 text-left">
                <p className="font-mono text-xs text-gray-600 dark:text-gray-300 break-all">
                  {error.message}
                </p>
              </div>
            )}
            <Button onClick={reset} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
