"use client";

import { Menu, Search, X } from "lucide-react";
import { useState } from "react";

export interface DocsSection {
  id: string;
  title: string;
  icon?: string;
  content: { heading: string; body: string[] }[];
}

export function DocsLayout({
  title,
  subtitle,
  sections,
  accentColor = "blue",
}: {
  title: string;
  subtitle: string;
  sections: DocsSection[];
  accentColor?: "blue" | "green" | "purple" | "indigo";
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const filteredSections = search.trim()
    ? sections.filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.content.some(
            (c) =>
              c.heading.toLowerCase().includes(search.toLowerCase()) ||
              c.body.some((b) =>
                b.toLowerCase().includes(search.toLowerCase()),
              ),
          ),
      )
    : sections;

  const active = sections.find((s) => s.id === activeId) ?? sections[0];

  const accentMap = {
    blue: {
      bg: "bg-blue-600",
      text: "text-blue-600 dark:text-blue-400",
      soft: "bg-blue-50 dark:bg-blue-900/20",
    },
    green: {
      bg: "bg-green-600",
      text: "text-green-600 dark:text-green-400",
      soft: "bg-green-50 dark:bg-green-900/20",
    },
    purple: {
      bg: "bg-purple-600",
      text: "text-purple-600 dark:text-purple-400",
      soft: "bg-purple-50 dark:bg-purple-900/20",
    },
    indigo: {
      bg: "bg-indigo-600",
      text: "text-indigo-600 dark:text-indigo-400",
      soft: "bg-indigo-50 dark:bg-indigo-900/20",
    },
  };
  const accent = accentMap[accentColor];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          {title}
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>

      <button
        onClick={() => setMobileNavOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-2xl border bg-white px-4 py-2.5 text-sm font-medium dark:border-gray-700 dark:bg-gray-900 lg:hidden"
        type="button"
      >
        <span className="flex items-center gap-2">
          {mobileNavOpen ? <X size={15} /> : <Menu size={15} />}
          {active?.title}
        </span>
      </button>

      <div className="flex gap-6">
        <aside
          className={`${mobileNavOpen ? "block" : "hidden"} w-full flex-shrink-0 space-y-3 lg:block lg:w-64`}
        >
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search docs..."
              className="h-9 w-full rounded-xl border bg-white pr-3 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>

          <div className="space-y-0.5 rounded-2xl border bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
            {filteredSections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveId(section.id);
                  setMobileNavOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeId === section.id
                    ? `${accent.soft} ${accent.text}`
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
                type="button"
              >
                {section.icon && <span>{section.icon}</span>}
                {section.title}
              </button>
            ))}
            {filteredSections.length === 0 && (
              <p className="px-3 py-4 text-center text-gray-400 text-sm">
                No topics found
              </p>
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {active && (
            <div className="space-y-8 rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900 sm:p-8">
              <div className="flex items-center gap-3 border-b pb-4 dark:border-gray-700">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${accent.bg} text-lg text-white`}
                >
                  {active.icon ?? "📄"}
                </div>
                <h2 className="font-black text-gray-900 text-xl dark:text-white">
                  {active.title}
                </h2>
              </div>

              {active.content.map((block) => (
                <div key={block.heading} className="space-y-2.5">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    {block.heading}
                  </h3>
                  <div className="space-y-2">
                    {block.body.map((para) => (
                      <p
                        key={para}
                        className="text-sm leading-relaxed text-gray-600 dark:text-gray-300"
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
