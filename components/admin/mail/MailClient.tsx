"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { markMessageRead, sendMessage } from "@/lib/actions/messages";

export function MailClient({
  inbox,
  sent,
  contacts,
}: {
  inbox: any[];
  sent: any[];
  contacts: any[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"inbox" | "sent" | "compose">("inbox");
  const [loading, setLoading] = useState(false);
  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await sendMessage(new FormData(e.currentTarget));
      if (res.success) {
        toast.success("Message sent");
        setTab("sent");
        router.refresh();
      } else toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }
  async function read(id: string) {
    const res = await markMessageRead(id);
    if (res.success) router.refresh();
  }
  const messages = tab === "sent" ? sent : inbox;
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["inbox", "sent", "compose"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === t ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 border dark:border-gray-700"}`}
          >
            {t[0].toUpperCase() + t.slice(1)}
            {t === "inbox" ? ` (${inbox.length})` : ""}
          </button>
        ))}
      </div>
      {tab === "compose" ? (
        <form
          onSubmit={handleSend}
          className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6 space-y-4 max-w-2xl"
        >
          <div className="space-y-1.5">
            <Label>To</Label>
            <select
              name="receiverId"
              required
              className="h-10 w-full rounded-lg border bg-background dark:bg-gray-800 dark:border-gray-600 px-3 text-sm"
            >
              <option value="">Select contact</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input name="subject" required />
          </div>
          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea name="body" rows={6} required />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Message"}
          </Button>
        </form>
      ) : (
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-12 text-center text-gray-400">
              No messages
            </div>
          ) : (
            messages.map((m) => (
              <button
                key={m.id}
                onClick={() =>
                  tab === "inbox" && !m.isRead ? read(m.id) : undefined
                }
                className={`block w-full text-left bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-5 ${!m.isRead && tab === "inbox" ? "border-blue-300 bg-blue-50/40" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold dark:text-white">{m.subject}</p>
                    <p className="text-sm text-gray-500">
                      {tab === "sent"
                        ? `To: ${m.receiver?.firstName} ${m.receiver?.lastName}`
                        : `From: ${m.sender?.firstName} ${m.sender?.lastName}`}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-line">
                      {m.body}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(m.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
                {m.replies?.length ? (
                  <p className="text-xs text-blue-600 mt-2">
                    {m.replies.length} replies
                  </p>
                ) : null}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
