"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/shared/DataTable";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
export function StudentTableClient({data}:{data:any[]}){return <DataTable data={data} searchKeys={["fullName","email"]} columns={[{key:"studentCode",label:"Student code"},{key:"fullName",label:"Full name"},{key:"email",label:"Email"},{key:"phone",label:"Phone"},{key:"courses",label:"Enrolled courses"},{key:"status",label:"Status",render:r=><StatusBadge status={r.status}/>},{key:"actions",label:"Actions",render:r=><div className="space-x-2"><Button asChild size="sm" variant="outline"><Link href={`/admin/students/${r.id}`}>View</Link></Button><Button asChild size="sm" variant="outline"><Link href={`/admin/students/${r.id}/edit`}>Edit</Link></Button></div>}]} />}
