import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

const navLinks = [
  { href: "/super-admin", label: "Overview" },
  { href: "/super-admin/campuses", label: "Campuses" },
  { href: "/super-admin/admins", label: "Admins" },
  { href: "/super-admin/students", label: "All Students" },
  { href: "/super-admin/teachers", label: "All Teachers" },
  { href: "/super-admin/courses", label: "All Courses" },
  { href: "/super-admin/payments", label: "All Payments" },
  { href: "/super-admin/reports", label: "Reports" },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r bg-white flex flex-col fixed inset-y-0">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold">Exceed</h1>
          <p className="text-xs text-muted-foreground mt-1">Super Admin</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t flex items-center gap-3">
          <UserButton />
          <span className="text-sm font-medium">Super Admin</span>
        </div>
      </aside>
      <main className="flex-1 ml-60 p-6 bg-gray-50 min-h-screen">
        {children}
      </main>
    </div>
  );
}
