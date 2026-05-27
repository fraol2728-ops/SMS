"use client";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
export function DataTable<T extends Record<string, any>>({columns,data,searchKeys}:{columns:{key:string;label:string;render?:(row:T)=>React.ReactNode}[];data:T[];searchKeys?:string[]}){const [q,setQ]=useState("");const rows=useMemo(()=>!q||!searchKeys?data:data.filter(r=>searchKeys.some(k=>String(r[k]??"").toLowerCase().includes(q.toLowerCase()))),[q,data,searchKeys]);return <div className="space-y-3">{searchKeys&&<Input placeholder="Search..." value={q} onChange={e=>setQ(e.target.value)} /> }<Table><TableHeader><TableRow>{columns.map(c=><TableHead key={c.key}>{c.label}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map((r,i)=><TableRow key={i}>{columns.map(c=><TableCell key={c.key}>{c.render?c.render(r):r[c.key]}</TableCell>)}</TableRow>)}</TableBody></Table></div>}
