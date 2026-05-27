import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { deleteStudent } from "@/lib/actions/admin";
export default async function StudentDetail({params}:{params:Promise<{id:string}>}){const {id}=await params;const s=await prisma.user.findUnique({where:{id},include:{studentProfile:{include:{enrollments:{include:{course:true,attendance:true,payments:true}}}}}});if(!s) return notFound();async function drop(){"use server";await deleteStudent(id);}return <div className="space-y-4"><div><h2 className="text-xl font-semibold">{s.firstName} {s.lastName}</h2><p>{s.studentProfile?.studentCode}</p><p>{s.email}</p></div><Link href={`/admin/students/${id}/edit`}>Edit student</Link><form action={drop}><button type="submit">Drop student</button></form></div>}
