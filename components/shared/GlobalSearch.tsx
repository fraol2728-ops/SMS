"use client";

import {
  BookOpen,
  GraduationCap,
  Loader2,
  Search,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type SearchResult = {
  type: "student" | "teacher" | "class";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

interface GlobalSearchProps {
  portal: "admin" | "super-admin" | "teacher";
  campusId?: string;
}

export function GlobalSearch({ portal, campusId }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleSearch(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim() || value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: value.trim(), portal });
        if (campusId) params.set("campusId", campusId);
        const response = await fetch(`/api/search?${params.toString()}`);
        const data = await response.json();
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleSelect(result: SearchResult) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(result.href);
  }

  const icons = { student: Users, teacher: GraduationCap, class: BookOpen };
  const typeColors = {
    student: "bg-blue-50 text-blue-600 dark:bg-blue-900/30",
    teacher: "bg-green-50 text-green-600 dark:bg-green-900/30",
    class: "bg-purple-50 text-purple-600 dark:bg-purple-900/30",
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={query}
          onChange={(event) => handleSearch(event.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search students, teachers, classes..."
          className="h-9 w-full rounded-xl border border-transparent bg-gray-100 pr-8 pl-9 text-sm transition-all placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:focus:bg-gray-700"
        />
        {loading ? (
          <Loader2
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400"
          />
        ) : null}
        {query && !loading ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-80 overflow-y-auto overflow-hidden rounded-2xl border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          {results.length === 0 && !loading ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              No results for &quot;{query}&quot;
            </div>
          ) : (
            <div className="p-2">
              {results.map((result) => {
                const Icon = icons[result.type];
                const colorClass = typeColors[result.type];
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${colorClass}`}
                    >
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900 text-sm dark:text-white">
                        {result.title}
                      </p>
                      <p className="truncate text-gray-400 text-xs">
                        {result.subtitle}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs capitalize ${colorClass}`}
                    >
                      {result.type}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
