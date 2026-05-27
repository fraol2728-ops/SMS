import { AdminHeader } from "@/components/admin/layout/AdminHeader";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-50"><AdminSidebar /><div className="ml-60"><AdminHeader /><main className="h-[calc(100vh-64px)] overflow-y-auto p-6">{children}</main></div></div>;
}
