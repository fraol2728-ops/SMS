"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CampusRail } from "./CampusRail";
import { SuperAdminHeader } from "./SuperAdminHeader";
import { SuperAdminSidebar } from "./SuperAdminSidebar";

type Campus = {
  id: string;
  name: string;
  color: string;
  _count: { users: number };
};

type Admin = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export function SuperAdminShell({
  campuses,
  admin,
  children,
}: {
  campuses: Campus[];
  admin: Admin;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialCampusId = searchParams.get("campusId") ?? campuses[0]?.id ?? "";
  const [selectedCampusId, setSelectedCampusId] = useState(initialCampusId);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function switchCampus(campusId: string) {
    setSelectedCampusId(campusId);
    setSidebarOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("campusId", campusId);
    router.push(`${pathname}?${params.toString()}`);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: close the mobile sidebar whenever the route path changes.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const campusId = searchParams.get("campusId");
    if (campusId && campusId !== selectedCampusId) {
      setSelectedCampusId(campusId);
    }
  }, [searchParams, selectedCampusId]);

  const selectedCampus =
    campuses.find((campus) => campus.id === selectedCampusId) ?? campuses[0];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <CampusRail
        campuses={campuses}
        selectedCampusId={selectedCampus?.id ?? selectedCampusId}
        onSelect={switchCampus}
        admin={admin}
      />

      {sidebarOpen ? (
        <button
          aria-label="Close sidebar"
          className="fixed top-14 right-0 bottom-0 left-0 z-30 bg-black/60 lg:inset-0 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <div
        className={`fixed top-14 bottom-0 left-0 z-40 w-56 transition-transform duration-300 lg:top-0 lg:left-16 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <SuperAdminSidebar
          campus={selectedCampus}
          campusId={selectedCampus?.id ?? selectedCampusId}
          admin={admin}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col pt-14 lg:pt-0 lg:ml-72">
        <SuperAdminHeader
          campus={selectedCampus}
          admin={admin}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
