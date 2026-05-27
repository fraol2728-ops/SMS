import { AdminHeader } from "@/components/admin/layout/AdminHeader";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";

const titles: Record<string, string> = {
  "": "Dashboard",
  students: "Students",
  courses: "Courses",
  teachers: "Teachers",
  schedules: "Schedules",
  attendance: "Attendance",
  payments: "Payments",
  reports: "Reports",
  notifications: "Notifications",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Kept simple for server layout; client sidebar handles active route state.
  const title = titles[""];

  return (
    <div className="min-h-screen bg-muted/20">
      <AdminSidebar />
      <div className="ml-[240px]">
        <AdminHeader title={title} />
        <main className="h-[calc(100vh-64px)] overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
