"use client";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addToWaitlist, updateWaitlist } from "@/lib/actions/admin";
export function WaitlistForm({ defaultValues }: { defaultValues?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<string[]>(
    defaultValues?.courses ?? [],
  );
  const [courseInput, setCourseInput] = useState("");
  function addCourse() {
    if (courseInput.trim() && !courses.includes(courseInput.trim())) {
      setCourses([...courses, courseInput.trim()]);
      setCourseInput("");
    }
  }
  function removeCourse(c: string) {
    setCourses(courses.filter((x) => x !== c));
  }
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (courses.length === 0) {
      toast.error("Please add at least one course");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("courses", courses.join("||"));
      const res = defaultValues?.id
        ? await updateWaitlist(defaultValues.id, formData)
        : await addToWaitlist(formData);
      if (res.success) {
        toast.success(
          defaultValues?.id
            ? "Waiting list entry updated"
            : "Added to waiting list",
        );
        router.push("/admin/waitlist");
      } else toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }
  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>First Name *</Label>
          <Input
            name="firstName"
            required
            defaultValue={defaultValues?.firstName}
            placeholder="First name"
          />
        </div>
        <div>
          <Label>Last Name *</Label>
          <Input
            name="lastName"
            required
            defaultValue={defaultValues?.lastName}
            placeholder="Last name"
          />
        </div>
      </div>
      <div>
        <Label>Phone Number *</Label>
        <Input
          name="phone"
          required
          defaultValue={defaultValues?.phone}
          placeholder="Phone number"
        />
      </div>
      <div>
        <Label>Courses They Can Teach *</Label>
        <div className="flex gap-2">
          <Input
            value={courseInput}
            onChange={(e) => setCourseInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addCourse())
            }
            placeholder="Type course name and press Enter or Add"
          />
          <Button type="button" variant="outline" onClick={addCourse}>
            Add
          </Button>
        </div>
        {courses.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {courses.map((c) => (
              <span
                key={c}
                className="flex items-center gap-1 bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full"
              >
                {c}
                <button
                  type="button"
                  onClick={() => removeCourse(c)}
                  className="hover:text-red-600"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div>
        <Label>Notes (optional)</Label>
        <Textarea
          name="notes"
          rows={2}
          defaultValue={defaultValues?.notes}
          placeholder="Any additional notes..."
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading
          ? "Saving..."
          : defaultValues?.id
            ? "Save Changes"
            : "Add to Waiting List"}
      </Button>
    </form>
  );
}
