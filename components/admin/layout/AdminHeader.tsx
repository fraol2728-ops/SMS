import { UserButton } from "@clerk/nextjs";

export function AdminHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6">
      <h1 className="text-lg font-semibold">{title}</h1>
      <UserButton />
    </header>
  );
}
