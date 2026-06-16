"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Footer } from "@/components/shared/Footer";
import { TeacherHeader } from "./TeacherHeader";
import { TeacherSidebar } from "./TeacherSidebar";

export function TeacherShell({
  children,
  teacher,
  classes,
}: {
  children: React.ReactNode;
  teacher: any;
  classes: any[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("teacher-sidebar-collapsed");
      if (stored === "true") setCollapsed(true);
    } catch {
      // localStorage not available — use default
    }
    setMounted(true);
  }, []);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("teacher-sidebar-collapsed", String(next));
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {mobileOpen && (
        <button
          aria-label="Close teacher navigation"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
          type="button"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden bg-gray-900 border-r border-gray-800 transition-all duration-300 ${
          mounted && collapsed ? "w-16" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div
          className={`flex items-center gap-3 p-4 border-b border-gray-800 flex-shrink-0 ${
            mounted && collapsed ? "justify-center" : ""
          }`}
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">E</span>
          </div>
          {(!mounted || !collapsed) && (
            <div>
              <h1 className="text-white font-bold leading-none">Exceed</h1>
              <p className="text-gray-400 text-xs">Teacher Portal</p>
            </div>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden ml-auto text-gray-400 hover:text-white p-1"
            type="button"
          >
            ×
          </button>
        </div>
        <TeacherSidebar
          teacher={teacher}
          classes={classes}
          collapsed={mounted && collapsed}
        />
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex items-center justify-center p-3 border-t border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors flex-shrink-0"
          title={collapsed ? "Expand" : "Collapse"}
          type="button"
        >
          {mounted && collapsed ? (
            <ChevronRight size={18} />
          ) : (
            <ChevronLeft size={18} />
          )}
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
        <TeacherHeader
          teacher={teacher}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
