import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { HomeClient } from "@/components/home/HomeClient";
import { getAuthRole } from "@/lib/clerk-role";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    const role = await getAuthRole();
    if (role === "SUPER_ADMIN") redirect("/super-admin");
    if (role === "ADMIN") redirect("/admin");
    if (role === "TEACHER") redirect("/teacher");
    if (role === "STUDENT") redirect("/student");
    redirect("/unauthorized");
  }

  return <HomeClient />;
}
