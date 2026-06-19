import type { DocsSection } from "@/components/shared/docs/DocsLayout";

export const studentDocs: DocsSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "👋",
    content: [
      {
        heading: "Welcome to Your Student Portal",
        body: [
          "This is where you can check your class, attendance, payments, materials, certificate status, and more — all in one place.",
          "Use the sidebar to move between sections. Everything here is view-only except your feedback and profile photo, which your admin manages on your behalf.",
        ],
      },
    ],
  },
  {
    id: "my-class",
    title: "My Class",
    icon: "📚",
    content: [
      {
        heading: "Your Classmates",
        body: [
          "My Class shows the course you are enrolled in along with your classmates and their phone numbers, so you can easily reach out for group work or to catch up on missed sessions.",
        ],
      },
    ],
  },
  {
    id: "attendance",
    title: "Attendance",
    icon: "✅",
    content: [
      {
        heading: "Tracking Your Attendance",
        body: [
          "The Attendance page shows your overall attendance rate along with a calendar view of every session — present, absent, or late.",
        ],
      },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    icon: "💳",
    content: [
      {
        heading: "Checking Your Balance",
        body: [
          "The Payments page shows everything you have paid so far. If you still owe a balance, you will see exactly how much and when it is due.",
          "To make a payment, contact your campus admin directly — payments are recorded by them.",
        ],
      },
    ],
  },
  {
    id: "materials",
    title: "Materials",
    icon: "📎",
    content: [
      {
        heading: "Class Resources",
        body: [
          "Materials shared by your teacher appear here, grouped by type — links, PDFs, documents, and more.",
        ],
      },
    ],
  },
  {
    id: "certificate",
    title: "Certificate",
    icon: "🎓",
    content: [
      {
        heading: "Certificate Status",
        body: [
          "Once your admin claims a certificate for you, this page shows its status: being processed, ready to collect, or delivered.",
          "If you have an outstanding balance, you will see a reminder here — certificates cannot be collected until your balance is fully paid.",
          "When your certificate is ready, you will also get a notification, and this page will show a celebration banner letting you know to visit the training center.",
        ],
      },
    ],
  },
  {
    id: "feedback",
    title: "Giving Feedback",
    icon: "💬",
    content: [
      {
        heading: "Sharing Your Experience",
        body: [
          "You can leave feedback about your class and teacher anytime from the Feedback page, or you'll be prompted when you sign out.",
          "You can update your written feedback and checkboxes anytime, but your star rating can only be given once per class.",
        ],
      },
    ],
  },
  {
    id: "notifications-events",
    title: "Notifications & Events",
    icon: "🔔",
    content: [
      {
        heading: "Staying Updated",
        body: [
          "Notifications keeps you informed about important updates from your admin, such as your certificate being ready.",
          "Events shows upcoming campus activities, including ones specifically for your class.",
        ],
      },
    ],
  },
  {
    id: "profile",
    title: "My Profile",
    icon: "👤",
    content: [
      {
        heading: "Your Information",
        body: [
          "My Profile shows your personal details on file. If anything needs to be corrected, contact your campus admin.",
        ],
      },
    ],
  },
];
