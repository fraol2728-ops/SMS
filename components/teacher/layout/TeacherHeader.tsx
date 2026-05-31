import { UserButton } from "@clerk/nextjs";

type TeacherHeaderUser = {
  firstName: string;
  lastName: string;
};

export function TeacherHeader({ teacher }: { teacher: TeacherHeaderUser }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6">
      <div>
        <p className="text-gray-500 text-sm">{greeting},</p>
        <p className="font-semibold text-gray-900">
          {teacher.firstName} {teacher.lastName}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right text-gray-500 text-sm">
          {now.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
        </div>
        <UserButton />
      </div>
    </header>
  );
}
