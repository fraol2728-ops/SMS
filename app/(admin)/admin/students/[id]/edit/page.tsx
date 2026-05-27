import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { StudentForm } from "@/components/admin/students/StudentForm";
import { prisma } from "@/lib/prisma";
export default async function EditStudentPage({params}:{params:Promise<{id:string}>}){const {id}=await params;const s=await prisma.user.findUnique({where:{id},include:{studentProfile:true}});if(!s) notFound();const courses=await prisma.course.findMany({where:{isActive:true}});return <div className="space-y-6"><PageHeader title="Edit student" /><StudentForm courses={courses} defaultValues={{id:s.id,firstName:s.firstName,lastName:s.lastName,email:s.email,phone:s.phone,gender:s.gender,address:s.address,dateOfBirth:s.dateOfBirth?.toISOString(),guardianName:s.studentProfile?.guardianName,guardianPhone:s.studentProfile?.guardianPhone,emergencyContact:s.studentProfile?.emergencyContact,notes:s.studentProfile?.notes}}/></div>}
