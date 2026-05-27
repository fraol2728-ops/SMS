import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
export function KpiCard({ title, value, icon:Icon, color }: {title:string; value:string|number; icon:LucideIcon; color:string}) { return <Card className={color}><CardContent className="p-4"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{title}</p><Icon className="h-4 w-4" /></div><p className="mt-2 text-2xl font-bold">{value}</p></CardContent></Card>; }
