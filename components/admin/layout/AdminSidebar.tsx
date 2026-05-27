"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, Calendar, ClipboardList, CreditCard, FileText, GraduationCap, LayoutDashboard, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
const items=[['/admin','Dashboard',LayoutDashboard],['/admin/students','Students',Users],['/admin/courses','Courses',BookOpen],['/admin/teachers','Teachers',GraduationCap],['/admin/schedules','Schedules',Calendar],['/admin/attendance','Attendance',ClipboardList],['/admin/payments','Payments',CreditCard],['/admin/reports','Reports',FileText],['/admin/notifications','Notifications',Bell]] as const;
export function AdminSidebar(){const path=usePathname();const {user}=useUser();return <aside className="fixed left-0 top-0 flex h-screen w-60 flex-col border-r bg-white"><div className="p-6 text-xl font-bold">Exceed</div><nav className="space-y-1 px-3">{items.map(([href,label,Icon])=><Link key={href} href={href} className={cn("flex items-center gap-2 rounded px-3 py-2 text-sm", path===href?"bg-gray-100 font-medium":"text-muted-foreground hover:bg-gray-50")}><Icon className="h-4 w-4"/>{label}</Link>)}</nav><div className="mt-auto border-t p-4"><div className="mb-3 flex items-center gap-2"><Avatar><AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback></Avatar><div className="text-sm"><p className="font-medium">{user?.fullName}</p></div></div><SignOutButton><button type="button" className="flex items-center gap-2 text-sm text-muted-foreground"><LogOut className="h-4 w-4"/>Sign out</button></SignOutButton></div></aside>}
