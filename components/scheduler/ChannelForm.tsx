"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createTelegramChannel } from "@/lib/actions/telegram";

export function ChannelForm({
  campuses,
}: {
  campuses: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const form = e.currentTarget;
      const res = await createTelegramChannel(new FormData(form));
      if (res.success) {
        toast.success("Channel added");
        form.reset();
        router.refresh();
      } else toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl p-5 space-y-3"
    >
      <h3 className="font-bold dark:text-white">Add Telegram Channel</h3>
      <input
        name="name"
        required
        placeholder="Channel display name"
        className="h-10 w-full rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white px-3 text-sm"
      />
      <input
        name="chatId"
        required
        placeholder="Chat ID (e.g. @yourchannel or -1001234567890)"
        className="h-10 w-full rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white px-3 text-sm"
      />
      <input
        name="botToken"
        required
        placeholder="Bot token (from @BotFather)"
        type="password"
        className="h-10 w-full rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white px-3 text-sm"
      />
      <select
        name="campusId"
        className="h-10 w-full rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white px-3 text-sm"
      >
        <option value="">All campuses</option>
        {campuses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm"
      >
        {loading ? "Adding..." : "Add Channel"}
      </button>
    </form>
  );
}
