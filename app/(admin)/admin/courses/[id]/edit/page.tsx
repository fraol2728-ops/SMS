import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { CourseForm } from "@/components/admin/courses/CourseForm";
import { prisma } from "@/lib/prisma";
export default async function EditCoursePage({params}:{params:Promise<{id:string}>}){const {id}=await params;const c=await prisma.course.findUnique({where:{id}});if(!c) notFound(); return <div className="space-y-6"><PageHeader title="Edit course" /><CourseForm defaultValues={c}/></div>}
