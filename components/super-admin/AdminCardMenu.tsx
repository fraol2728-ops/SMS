"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MoreVertical, Edit, Trash2 } from "lucide-react";

export function AdminCardMenu({ adminId }: { adminId: string }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          setShowMenu(!showMenu);
        }}
        className="absolute right-2 top-2 rounded-lg p-1.5 text-gray-400 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
      >
        <MoreVertical size={18} />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-8 z-50 w-40 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <Link href={`/super-admin/admins/${adminId}/edit`}>
            <button
              onClick={() => setShowMenu(false)}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Edit size={16} /> Edit
            </button>
          </Link>
          <button
            onClick={() => setShowMenu(false)}
            className="flex w-full items-center gap-2 border-t border-gray-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
