import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-check";

export const dynamic = "force-dynamic";

export default async function SchedulesPage() {
  await requireAdmin();
  redirect("/admin/classes");
}
