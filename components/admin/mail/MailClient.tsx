"use client";

import { Inbox, Pencil, Reply, Send, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteMessage,
  markMessageRead,
  sendMessage,
} from "@/lib/actions/messages";

type Contact = {
  id: string;
  label: string;
};

type MessageContact = {
  firstName: string;
  lastName: string;
  role?: string;
};

type MailMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  sender?: MessageContact;
  receiver?: MessageContact;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: Date | string;
  replies?: { id: string }[];
};

export function MailClient({
  inbox,
  sent,
  contacts,
}: {
  inbox: MailMessage[];
  sent: MailMessage[];
  contacts: Contact[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"inbox" | "sent" | "compose">("inbox");
  const [selectedMessage, setSelectedMessage] = useState<MailMessage | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [replyBody, setReplyBody] = useState("");

  async function handleSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const res = await sendMessage(formData);
      if (res.success) {
        toast.success("Message sent");
        setTab("sent");
        setSelectedMessage(null);
        router.refresh();
        form.reset();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleReply(
    parentId: string,
    receiverId: string,
    subject: string,
  ) {
    if (!replyBody.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("receiverId", receiverId);
      formData.set(
        "subject",
        subject.startsWith("Re: ") ? subject : `Re: ${subject}`,
      );
      formData.set("body", replyBody);
      formData.set("parentId", parentId);

      const res = await sendMessage(formData);
      if (res.success) {
        toast.success("Reply sent");
        setReplyBody("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRead(messageId: string) {
    const res = await markMessageRead(messageId);
    if (res.success) {
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function handleDelete(messageId: string) {
    if (!confirm("Delete this message?")) return;

    const res = await deleteMessage(messageId);
    if (res.success) {
      toast.success("Message deleted");
      setSelectedMessage(null);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  const messages = tab === "inbox" ? inbox : sent;

  return (
    <div className="flex min-h-[400px] flex-col gap-4 lg:h-[calc(100vh-220px)] lg:flex-row">
      <div className="flex flex-shrink-0 flex-col gap-3 lg:w-72">
        <Button
          className="w-full gap-2"
          onClick={() => {
            setTab("compose");
            setSelectedMessage(null);
          }}
        >
          <Pencil size={15} />
          Compose
        </Button>

        <div className="overflow-hidden rounded-xl border bg-white dark:border-gray-700 dark:bg-gray-900">
          {[
            {
              id: "inbox",
              label: "Inbox",
              icon: Inbox,
              count: inbox.filter((m) => !m.isRead).length,
            },
            { id: "sent", label: "Sent", icon: Send, count: 0 },
          ].map(({ id, label, icon: Icon, count }) => (
            <button
              type="button"
              key={id}
              onClick={() => {
                setTab(id as "inbox" | "sent");
                setSelectedMessage(null);
              }}
              className={`flex w-full items-center justify-between border-b px-4 py-3 text-sm font-medium transition-colors last:border-b-0 dark:border-gray-700 ${
                tab === id
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon size={15} />
                {label}
              </div>
              {count > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab !== "compose" && (
          <div className="flex-1 overflow-y-auto rounded-xl border bg-white dark:border-gray-700 dark:bg-gray-900">
            {messages.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                No messages
              </div>
            ) : (
              <div className="divide-y dark:divide-gray-700">
                {messages.map((msg) => {
                  const contact = tab === "inbox" ? msg.sender : msg.receiver;
                  const isUnread = tab === "inbox" && !msg.isRead;

                  return (
                    <button
                      type="button"
                      key={msg.id}
                      onClick={() => {
                        setSelectedMessage(msg);
                        if (isUnread) void handleRead(msg.id);
                      }}
                      className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        selectedMessage?.id === msg.id
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : ""
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        {isUnread && (
                          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                        )}
                        <p
                          className={`truncate text-sm ${
                            isUnread
                              ? "font-bold dark:text-white"
                              : "font-medium dark:text-gray-300"
                          }`}
                        >
                          {contact?.firstName} {contact?.lastName}
                        </p>
                      </div>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {msg.subject}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                        <span>
                          {new Date(msg.createdAt).toLocaleDateString("en-GB")}
                        </span>
                        {!!msg.replies?.length && (
                          <span>• {msg.replies.length} replies</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {tab === "compose" && (
          <div className="h-full rounded-xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-5 font-semibold dark:text-white">New Message</h2>
            <form
              onSubmit={handleSend}
              className="flex h-full flex-col space-y-4"
            >
              <div className="space-y-1.5">
                <Label>To *</Label>
                <select
                  name="receiverId"
                  required
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm dark:border-gray-600 dark:bg-gray-800"
                >
                  <option value="">Select recipient</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Subject *</Label>
                <Input name="subject" required placeholder="Message subject" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label>Message *</Label>
                <Textarea
                  name="body"
                  required
                  rows={8}
                  placeholder="Write your message..."
                  className="resize-none"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full gap-2 sm:w-auto"
              >
                <Send size={15} />
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        )}

        {selectedMessage && tab !== "compose" && (
          <div className="flex h-full flex-col rounded-xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold dark:text-white">
                  {selectedMessage.subject}
                </h2>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  {tab === "inbox"
                    ? `From: ${selectedMessage.sender?.firstName} ${selectedMessage.sender?.lastName}`
                    : `To: ${selectedMessage.receiver?.firstName} ${selectedMessage.receiver?.lastName}`}
                  {" • "}
                  {new Date(selectedMessage.createdAt).toLocaleString("en-GB")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleDelete(selectedMessage.id)}
                className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                aria-label="Delete message"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="mb-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                  {selectedMessage.body}
                </p>
              </div>
            </div>

            {tab === "inbox" && (
              <div className="mt-4 border-t pt-4 dark:border-gray-700">
                <Label className="mb-2 block">Reply</Label>
                <Textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={3}
                  placeholder="Write a reply..."
                  className="mb-3"
                />
                <Button
                  onClick={() =>
                    void handleReply(
                      selectedMessage.id,
                      selectedMessage.senderId,
                      selectedMessage.subject,
                    )
                  }
                  disabled={loading || !replyBody.trim()}
                  size="sm"
                  className="gap-2"
                >
                  <Reply size={14} />
                  {loading ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            )}
          </div>
        )}

        {!selectedMessage && tab !== "compose" && (
          <div className="flex h-full items-center justify-center rounded-xl border bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="text-center">
              <p className="mb-3 text-4xl">📬</p>
              <p className="text-gray-400">Select a message to read</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
