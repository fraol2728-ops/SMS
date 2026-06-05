"use client";

import { useSearchParams } from "next/navigation";
import { GlobalSearch } from "@/components/shared/GlobalSearch";

export function SuperAdminSearchWrapper() {
  const searchParams = useSearchParams();
  const campusId = searchParams.get("campusId") ?? undefined;

  return <GlobalSearch portal="super-admin" campusId={campusId} />;
}
