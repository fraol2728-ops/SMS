"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createStudent, updateStudent } from "@/lib/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function StudentForm({ courses, defaultValues }: { courses: any[]; defaultValues?: any }) {
  const router = useRouter(); const [loading, setLoading] = useState(false);
  const isEdit = !!defaultValues;
  async function onSubmit(formData: FormData) { setLoading(true); const res = isEdit ? await updateStudent(defaultValues.id, formData) : await createStudent(formData); setLoading(false); if (res.success) router.push("/admin/students"); else toast.error(res.error); }
  return <form action={onSubmit} className="space-y-4">
    <Card><CardHeader><CardTitle>Personal info</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2"><Input name="firstName" placeholder="First name*" defaultValue={defaultValues?.firstName}/><Input name="lastName" placeholder="Last name*" defaultValue={defaultValues?.lastName}/><Input name="email" placeholder="Email*" defaultValue={defaultValues?.email}/><Input name="phone" placeholder="Phone" defaultValue={defaultValues?.phone}/><select name="gender" defaultValue={defaultValues?.gender ?? ""} className="h-10 rounded-md border px-3"><option value="">Gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select><Input name="dateOfBirth" type="date" defaultValue={defaultValues?.dateOfBirth?.slice?.(0,10)} /><Textarea name="address" placeholder="Address" defaultValue={defaultValues?.address} className="md:col-span-2"/></CardContent></Card>
    <Card><CardHeader><CardTitle>Guardian info</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2"><Input name="guardianName" placeholder="Guardian name" defaultValue={defaultValues?.guardianName}/><Input name="guardianPhone" placeholder="Guardian phone" defaultValue={defaultValues?.guardianPhone}/><Input name="emergencyContact" placeholder="Emergency contact" className="md:col-span-2" defaultValue={defaultValues?.emergencyContact}/></CardContent></Card>
    {!isEdit && <Card><CardHeader><CardTitle>Enrollment</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2"><select name="courseId" className="h-10 rounded-md border px-3">{courses.map((c)=><option key={c.id} value={c.id}>{c.title} - ETB {c.fee}</option>)}</select><Input type="date" name="startDate"/></CardContent></Card>}
    <Card><CardHeader><CardTitle>Notes</CardTitle></CardHeader><CardContent><Textarea name="notes" defaultValue={defaultValues?.notes}/></CardContent></Card>
    <Button type="submit">{loading ? (isEdit ? "Updating..." : "Registering...") : (isEdit ? "Update student" : "Register student")}</Button>
  </form>;
}
