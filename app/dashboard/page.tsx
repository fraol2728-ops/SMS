import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.role === "SUPER_ADMIN") redirect("/super-admin");
  if (user.role === "ADMIN") redirect("/admin");
  if (user.role === "TEACHER") redirect("/teacher");
  if (user.role === "STUDENT") redirect("/student");
  redirect("/unauthorized");
}
