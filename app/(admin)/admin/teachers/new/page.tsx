import { PageHeader } from "@/components/admin/shared/PageHeader";import { TeacherForm } from "@/components/admin/teachers/TeacherForm";

export const dynamic = 'force-dynamic'

export default function NewTeacherPage(){return <div className='space-y-6'><PageHeader title='Add teacher'/><TeacherForm/></div>}
