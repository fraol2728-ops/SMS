"use client";

export function SuperAdminHeader({ name }: { name: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 dark:border-gray-700 dark:bg-gray-900 sm:px-6">
      <button
        onClick={() => document.getElementById("super-sidebar-toggle")?.click()}
        className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
        type="button"
      >
        ☰
      </button>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-gray-500 text-sm dark:text-gray-400">{name}</span>
      </div>
    </header>
  );
}
