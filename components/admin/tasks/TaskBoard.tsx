"use client";

import { AlertTriangle, Check, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cancelTask, completeTask, createTask } from "@/lib/actions/tasks";

const PRIORITY_CONFIG = {
  LOW: { label: "Low", color: "bg-gray-100 text-gray-600", icon: "○" },
  MEDIUM: { label: "Medium", color: "bg-blue-50 text-blue-700", icon: "◐" },
  HIGH: { label: "High", color: "bg-red-50 text-red-700", icon: "●" },
};
const STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "bg-gray-100 text-gray-600" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-50 text-blue-700" },
  COMPLETED: { label: "Completed", color: "bg-green-50 text-green-700" },
  CANCELLED: { label: "Cancelled", color: "bg-red-50 text-red-600" },
};

export function TaskBoard({
  tasks,
  assignees,
}: {
  tasks: any[];
  assignees: any[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completeNote, setCompleteNote] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const visibleTasks = tasks.filter((t) => {
    if (
      t.status === "COMPLETED" &&
      t.completedAt &&
      new Date(t.completedAt) < oneWeekAgo
    )
      return false;
    if (filter === "pending")
      return t.status === "PENDING" || t.status === "IN_PROGRESS";
    if (filter === "completed") return t.status === "COMPLETED";
    return true;
  });
  const pendingCount = tasks.filter(
    (t) => t.status === "PENDING" || t.status === "IN_PROGRESS",
  ).length;
  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createTask(new FormData(e.currentTarget));
      if (res.success) {
        toast.success("Task created");
        setShowForm(false);
        router.refresh();
      } else toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }
  async function handleComplete(taskId: string) {
    setLoading(true);
    try {
      const res = await completeTask(taskId, completeNote);
      if (res.success) {
        toast.success("Task marked as completed");
        setCompletingId(null);
        setCompleteNote("");
        router.refresh();
      } else toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }
  async function handleCancel(taskId: string) {
    if (!confirm("Cancel this task?")) return;
    const res = await cancelTask(taskId);
    if (res.success) {
      toast.success("Task cancelled");
      router.refresh();
    } else toast.error(res.error);
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2">
          {[
            { id: "all", label: `All (${tasks.length})` },
            { id: "pending", label: `Pending (${pendingCount})` },
            { id: "completed", label: "Completed" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${filter === f.id ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-600"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus size={16} />
          New Task
        </Button>
      </div>
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6">
          <h2 className="font-semibold dark:text-white mb-4">
            Create New Task
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Task Title *</Label>
                <Input
                  name="title"
                  required
                  placeholder="What needs to be done?"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  name="description"
                  rows={2}
                  placeholder="More details..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Assign To *</Label>
                <select
                  name="assigneeId"
                  className="h-10 w-full rounded-lg border bg-background dark:bg-gray-800 dark:border-gray-600 px-3 text-sm"
                >
                  <option value="">Assign to myself</option>
                  {assignees.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <select
                  name="priority"
                  defaultValue="MEDIUM"
                  className="h-10 w-full rounded-lg border bg-background dark:bg-gray-800 dark:border-gray-600 px-3 text-sm"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <input
                  name="dueDate"
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  className="h-10 w-full rounded-lg border bg-background dark:bg-gray-800 dark:border-gray-600 px-3 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Task"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
      {visibleTasks.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-12 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-semibold dark:text-white">No tasks yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleTasks.map((task) => {
            const priority =
              PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
            const status =
              STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
            const isOverdue =
              task.dueDate &&
              new Date(task.dueDate) < new Date() &&
              task.status !== "COMPLETED";
            const isCompleted = task.status === "COMPLETED";
            const isCompletingThis = completingId === task.id;
            return (
              <div
                key={task.id}
                className={`bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-5 ${isCompleted ? "opacity-60" : ""} ${isOverdue ? "border-red-200" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${priority.color}`}
                      >
                        {priority.icon} {priority.label}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${status?.color ?? "bg-gray-100"}`}
                      >
                        {status?.label ?? task.status}
                      </span>
                      {isOverdue && (
                        <span className="text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle size={10} /> Overdue
                        </span>
                      )}
                    </div>
                    <p
                      className={`font-semibold dark:text-white ${isCompleted ? "line-through" : ""}`}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                      <span>
                        Assigned to:{" "}
                        {task.assignee
                          ? `${task.assignee.firstName} ${task.assignee.lastName}`
                          : "Unassigned"}
                      </span>
                      {task.dueDate && (
                        <span className={isOverdue ? "text-red-500" : ""}>
                          Due:{" "}
                          {new Date(task.dueDate).toLocaleDateString("en-GB")}
                        </span>
                      )}
                      {isCompleted && task.completedAt && (
                        <span className="text-green-600">
                          Completed:{" "}
                          {new Date(task.completedAt).toLocaleDateString(
                            "en-GB",
                          )}
                        </span>
                      )}
                    </div>
                    {task.completedNote && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Note: {task.completedNote}
                      </p>
                    )}
                  </div>
                  {!isCompleted && task.status !== "CANCELLED" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCompletingId(isCompletingThis ? null : task.id)
                        }
                        className="p-2 bg-green-50 text-green-600 rounded-lg"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleCancel(task.id)}
                        className="p-2 bg-red-50 text-red-500 rounded-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
                {isCompletingThis && (
                  <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-3">
                    <Label>Completion Note (optional)</Label>
                    <Textarea
                      value={completeNote}
                      onChange={(e) => setCompleteNote(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleComplete(task.id)}
                        disabled={loading}
                        className="bg-green-600"
                      >
                        {loading ? "Saving..." : "Mark as Completed"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCompletingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
