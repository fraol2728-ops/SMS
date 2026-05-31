import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-check";

export default async function NewSchedulePage() {
  await requireAdmin();
  redirect("/admin/classes/new");
}
