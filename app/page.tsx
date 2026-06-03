import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { HomeClient } from "@/components/home/HomeClient";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    const user = await currentUser();
    const role = user?.publicMetadata?.role as string | undefined;
    if (role === "SUPER_ADMIN") redirect("/super-admin");
    if (role === "ADMIN") redirect("/admin");
    if (role === "TEACHER") redirect("/teacher");
    if (role === "STUDENT") redirect("/student");
    redirect("/unauthorized");
  }

  return <HomeClient />;
}
