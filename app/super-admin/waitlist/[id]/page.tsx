export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { WaitlistDetailClient } from "@/components/admin/waitlist/WaitlistDetailClient";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminWaitlistDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const { campusId } = (await searchParams) ?? {};

  const entry = await prisma.teacherWaitlist.findUnique({
    where: { id },
  });

  if (!entry) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <Link href={`/super-admin/waitlist?campusId=${campusId ?? ""}`}>
        <button
          className="text-gray-500 text-sm hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          type="button"
        >
          ← Back
        </button>
      </Link>
      <PageHeader title={`${entry.firstName} ${entry.lastName}`} />
      <WaitlistDetailClient
        entry={entry}
        basePath="/super-admin"
        campusId={campusId}
        redirectTo={`/super-admin/waitlist?campusId=${campusId ?? ""}`}
      />
    </div>
  );
}
