"use client";
import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
const titles:Record<string,string>={"/admin":"Dashboard","/admin/students":"Students","/admin/courses":"Courses","/admin/teachers":"Teachers","/admin/schedules":"Schedules","/admin/attendance":"Attendance","/admin/payments":"Payments","/admin/reports":"Reports","/admin/notifications":"Notifications"};
export function AdminHeader(){const p=usePathname();const key=Object.keys(titles).sort((a,b)=>b.length-a.length).find(k=>p.startsWith(k))??"/admin";return <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6"><h1 className="text-lg font-semibold">{titles[key]}</h1><UserButton /></header>}
