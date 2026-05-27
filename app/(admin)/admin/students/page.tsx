import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";
import { StudentTableClient } from "@/components/admin/students/StudentTableClient";
export default async function StudentsPage(){const rows=await prisma.user.findMany({where:{role:"STUDENT"},include:{studentProfile:{include:{enrollments:true}}}});const data=rows.map(r=>({id:r.id,studentCode:r.studentProfile?.studentCode??"-",fullName:`${r.firstName} ${r.lastName}`,email:r.email,phone:r.phone??"-",courses:r.studentProfile?.enrollments.length??0,status:r.studentProfile?.enrollments.some(e=>e.status==="ACTIVE")?"ACTIVE":"ON_HOLD"}));return <div><PageHeader title="Students" action={<Button asChild><Link href="/admin/students/new">Add new student</Link></Button>} /><StudentTableClient data={data}/></div>}
