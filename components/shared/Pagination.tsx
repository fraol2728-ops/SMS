"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  }

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);
  const pages: { key: string; value: number | "..." }[] = [];
  const addPage = (page: number) =>
    pages.push({ key: `page-${page}`, value: page });
  const addEllipsis = (position: "left" | "right") =>
    pages.push({ key: `ellipsis-${position}`, value: "..." });

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i += 1) addPage(i);
  } else {
    addPage(1);
    if (currentPage > 3) addEllipsis("left");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i += 1
    ) {
      addPage(i);
    }
    if (currentPage < totalPages - 2) addEllipsis("right");
    addPage(totalPages);
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t pt-4 dark:border-gray-700 sm:flex-row">
      <p className="text-gray-500 text-sm dark:text-gray-400">
        Showing {start}–{end} of {totalItems} students
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-800"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map(({ key, value }) =>
          value === "..." ? (
            <span
              key={key}
              className="flex h-8 w-8 items-center justify-center text-gray-400 text-sm"
            >
              …
            </span>
          ) : (
            <button
              key={key}
              type="button"
              onClick={() => goToPage(value)}
              className={`h-8 w-8 rounded-lg font-medium text-sm transition-colors ${
                value === currentPage
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {value}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-800"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
