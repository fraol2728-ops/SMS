export const dynamic = "force-dynamic";

import Link from "next/link";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

type CampusRow = {
  id: string;
  name: string;
  location: string | null;
  _count: { users: number; courses: number };
};

export default async function CampusesPage() {
  const campuses = await prisma.campus.findMany({
    include: {
      _count: {
        select: {
          users: true,
          courses: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campuses"
        action={{ label: "Add campus", href: "/super-admin/campuses/new" }}
      />
      <div className="grid gap-4">
        {(campuses as CampusRow[]).map((campus) => (
          <div
            key={campus.id}
            className="bg-white border rounded-xl p-6 flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold text-lg">{campus.name}</h3>
              <p className="text-sm text-muted-foreground">{campus.location}</p>
              <div className="flex gap-6 mt-2 text-sm text-muted-foreground">
                <span>{campus._count.users} users</span>
                <span>{campus._count.courses} courses</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/super-admin/campuses/${campus.id}`}>Manage</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
