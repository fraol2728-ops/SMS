import { PageHeader } from "@/components/admin/shared/PageHeader";import { DataTable } from "@/components/admin/shared/DataTable";import { prisma } from "@/lib/prisma";
export const dynamic = 'force-dynamic'

const day=(n:number)=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][n];
export default async function SchedulesPage(){const s=await prisma.schedule.findMany({include:{course:true,teacher:{include:{user:true}}}});return <div className='space-y-6'><PageHeader title='Schedules' action={{label:'Add schedule',href:'/admin/schedules/new'}}/><DataTable data={s} columns={[{key:'course',label:'Course',render:r=>r.course.title},{key:'teacher',label:'Teacher name',render:r=>`${r.teacher.user.firstName} ${r.teacher.user.lastName}`},{key:'dayOfWeek',label:'Day',render:r=>day(r.dayOfWeek)},{key:'time',label:'Start–End time',render:r=>`${r.startTime}–${r.endTime}`},{key:'room',label:'Room'},{key:'actions',label:'Actions',render:()=>'-'}]} /></div>}
