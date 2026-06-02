"use client";

import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Campus = {
  id: string;
  name: string;
};

export function SuperAdminHeader({
  name,
  campuses,
}: {
  name: string;
  campuses: Campus[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);

  const selectedCampusId =
    searchParams.get("campusId") ?? campuses[0]?.id ?? "all";

  const selectedCampus =
    selectedCampusId === "all"
      ? { id: "all", name: "All Campuses" }
      : campuses.find((campus) => campus.id === selectedCampusId) ?? {
          id: "all",
          name: "All Campuses",
        };

  function selectCampus(campusId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (campusId === "all") params.delete("campusId");
    else params.set("campusId", campusId);
    const query = params.toString();
    setMenuOpen(false);
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-4 py-2 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
      <div className="flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => document.getElementById("super-sidebar-toggle")?.click()}
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            type="button"
          >
            ☰
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600"
              type="button"
            >
              <span>{selectedCampus.name}</span>
              <ChevronDown size={16} className="text-slate-500" />
            </button>

            {menuOpen && campuses.length > 0 && (
              <div className="absolute left-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                <button
                  type="button"
                  onClick={() => selectCampus("all")}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition ${
                    selectedCampusId === "all"
                      ? "bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-white"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                  }`}
                >
                  <span>All Campuses</span>
                </button>
                {campuses.map((campus) => (
                  <button
                    key={campus.id}
                    type="button"
                    onClick={() => selectCampus(campus.id)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition ${
                      selectedCampusId === campus.id
                        ? "bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-white"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                    }`}
                  >
                    <span>{campus.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ml-auto text-sm text-slate-500 dark:text-slate-400">{name}</div>
      </div>
    </header>
  );
}
