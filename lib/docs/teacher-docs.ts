import type { DocsSection } from "@/components/shared/docs/DocsLayout";

export const teacherDocs: DocsSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "👋",
    content: [
      {
        heading: "Welcome to Your Teacher Portal",
        body: [
          "This is your space to manage your classes, mark attendance, upload materials, and track your own performance.",
          "Use the sidebar to move between sections. On mobile, tap the menu icon to open it.",
        ],
      },
    ],
  },
  {
    id: "classes",
    title: "My Classes",
    icon: "📚",
    content: [
      {
        heading: "Viewing Your Classes",
        body: [
          "My Classes shows every class assigned to you, along with the course, lab, schedule, and number of enrolled students.",
          "Tap a class to see the full list of students enrolled in it, including their contact phone numbers.",
        ],
      },
    ],
  },
  {
    id: "attendance",
    title: "Taking Attendance",
    icon: "✅",
    content: [
      {
        heading: "Marking Students Present, Absent, or Late",
        body: [
          "Open the Attendance page, pick a date and class, and mark each student's status for that session.",
          "Attendance you record here feeds directly into your performance score and the student's own attendance history.",
        ],
      },
    ],
  },
  {
    id: "materials",
    title: "Sharing Materials",
    icon: "📎",
    content: [
      {
        heading: "Uploading Class Materials",
        body: [
          "Go to Materials to share links with your students — class slides, documents, or other resources hosted elsewhere.",
          "Choose a material type (Link, PDF, Document, or Other) so students can find things easily on their end.",
        ],
      },
    ],
  },
  {
    id: "performance",
    title: "My Performance",
    icon: "⭐",
    content: [
      {
        heading: "Understanding Your Score",
        body: [
          "My Performance shows a score out of 100, built from four parts: how students rate your classes, the balance of positive versus constructive feedback, attendance rates in your classes, and how many students stay enrolled.",
          "Below the score you'll see exactly what students say they appreciate, and areas mentioned as room for improvement — use this to keep getting better.",
          "This score updates automatically as new student feedback and attendance records come in.",
        ],
      },
    ],
  },
  {
    id: "feedback",
    title: "Student Feedback",
    icon: "💬",
    content: [
      {
        heading: "Where Feedback Comes From",
        body: [
          "Students can leave feedback about your teaching style either from a dedicated page in their portal or when they sign out. You do not need to do anything — feedback simply contributes to your performance score automatically.",
        ],
      },
    ],
  },
  {
    id: "events",
    title: "Events",
    icon: "📅",
    content: [
      {
        heading: "Upcoming Events",
        body: [
          "The Events page shows campus-wide events and any events specifically targeted at classes you teach.",
        ],
      },
    ],
  },
];
