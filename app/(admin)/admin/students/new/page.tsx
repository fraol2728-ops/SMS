import { PageHeader } from "@/components/admin/shared/PageHeader";
import { StudentForm } from "@/components/admin/students/StudentForm";
import { prisma } from "@/lib/prisma";
export default async function NewStudentPage(){const courses=await prisma.course.findMany({where:{isActive:true}});return <div className="space-y-6"><PageHeader title="Register new student" /><StudentForm courses={courses} /></div>}
