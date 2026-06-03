"use client";

import { AlertTriangle, Check, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { completeTask } from "@/lib/actions/tasks";

const PRIORITY_COLORS = {
  LOW: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  MEDIUM: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  HIGH: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};
export function TeacherTaskList({ tasks }: { tasks: any[] }) {
  const router = useRouter();
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  async function handleComplete(taskId: string) {
    setLoading(true);
    try {
      const res = await completeTask(taskId, note);
      if (res.success) {
        toast.success("Task marked as completed!");
        setCompletingId(null);
        setNote("");
        router.refresh();
      } else toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }
  if (tasks.length === 0)
    return (
      <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-12 text-center">
        <p className="text-4xl mb-3">🎉</p>
        <p className="font-semibold dark:text-white">No tasks assigned</p>
        <p className="text-sm text-gray-400 mt-1">
          You have no pending tasks right now
        </p>
      </div>
    );
  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const isCompleted = task.status === "COMPLETED";
        const isOverdue =
          task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;
        const isCompletingThis = completingId === task.id;
        return (
          <div
            key={task.id}
            className={`bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-5 ${isCompleted ? "opacity-60" : ""} ${isOverdue ? "border-red-200" : ""}`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}`}
                  >
                    {task.priority}
                  </span>
                  {isOverdue && (
                    <span className="text-xs text-red-600 flex items-center gap-1">
                      <AlertTriangle size={10} /> Overdue
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                      ✓ Completed
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
                    From: {task.createdBy.firstName} {task.createdBy.lastName}
                  </span>
                  {task.dueDate && (
                    <span
                      className={`flex items-center gap-1 ${isOverdue ? "text-red-500" : ""}`}
                    >
                      <Clock size={10} /> Due:{" "}
                      {new Date(task.dueDate).toLocaleDateString("en-GB")}
                    </span>
                  )}
                </div>
                {task.completedNote && (
                  <p className="text-xs text-gray-400 mt-1 italic">
                    Your note: {task.completedNote}
                  </p>
                )}
              </div>
              {!isCompleted && (
                <button
                  type="button"
                  onClick={() =>
                    setCompletingId(isCompletingThis ? null : task.id)
                  }
                  className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 text-sm rounded-xl font-medium"
                >
                  <Check size={14} />
                  Complete
                </button>
              )}
            </div>
            {isCompletingThis && (
              <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-3">
                <Label>Add a note (optional)</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Describe what you did..."
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleComplete(task.id)}
                    disabled={loading}
                    className="bg-green-600"
                  >
                    {loading ? "Saving..." : "Mark Complete"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCompletingId(null);
                      setNote("");
                    }}
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
  );
}
