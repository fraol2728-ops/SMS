import { requireAdmin } from "@/lib/auth-check";
export default async function Page() {
  await requireAdmin();
  return <h1 className="text-xl font-semibold">Exceed</h1>;
}
