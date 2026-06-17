"use client";

import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Footer } from "@/components/shared/Footer";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";

export function AdminShell({
  children,
  user,
  settings,
}: {
  children: React.ReactNode;
  user: any;
  settings: any;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ALL side effects in useEffect — never in render
  useEffect(() => {
    try {
      const stored = localStorage.getItem("admin-sidebar-collapsed");
      if (stored === "true") setCollapsed(true);
    } catch {
      // localStorage not available — use default
    }
    setMounted(true);
  }, []);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    // Side effect in event handler is fine
    // but wrap in try/catch for safety
    try {
      localStorage.setItem("admin-sidebar-collapsed", String(next));
    } catch {
      // ignore
    }
  }

  // Always return JSX — never return null or undefined
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {mobileOpen && (
        <button
          aria-label="Close admin navigation"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
          type="button"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden
          border-gray-800 border-r bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950
          transition-all duration-300 ease-out
          ${mounted && collapsed ? "w-16" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div
          className={`flex flex-shrink-0 items-center gap-3 border-gray-800 border-b p-4 ${
            mounted && collapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex h-9 w-9 flex-shrink-0 animate-pulse items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20 shadow-lg">
            <span className="font-black text-sm text-white">E</span>
          </div>
          {(!mounted || !collapsed) && (
            <div>
              <h1 className="bg-gradient-to-r from-white to-blue-200 bg-clip-text font-bold leading-none text-transparent">
                Exceed
              </h1>
              <p className="text-gray-400 text-xs">Admin Portal</p>
            </div>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1 text-gray-400 transition-colors hover:text-white lg:hidden"
            type="button"
          >
            ×
          </button>
        </div>

        <AdminSidebar user={user} collapsed={mounted && collapsed} />

        <button
          onClick={toggleCollapse}
          className="hidden flex-shrink-0 items-center justify-center border-gray-800 border-t p-3 text-gray-400 transition-all duration-300 ease-out hover:bg-white/5 hover:text-white lg:flex"
          title={collapsed ? "Expand" : "Collapse"}
          type="button"
        >
          <ChevronLeft
            className={`transition-transform duration-300 ${mounted && collapsed ? "rotate-180" : ""}`}
            size={16}
          />
          {(!mounted || !collapsed) && (
            <span className="ml-2 text-xs">Collapse</span>
          )}
        </button>
      </aside>

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          mounted && collapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
      >
        <AdminHeader
          user={user}
          onMenuClick={() => setMobileOpen(true)}
          settings={settings}
        />
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
