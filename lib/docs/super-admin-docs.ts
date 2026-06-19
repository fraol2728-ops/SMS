import type { DocsSection } from "@/components/shared/docs/DocsLayout";

export const superAdminDocs: DocsSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "👋",
    content: [
      {
        heading: "Welcome, Super Admin",
        body: [
          "The Super Admin portal gives you visibility and control across every campus, not just one. Use the campus switcher at the top of the sidebar to move between Megenagna and Mexico.",
          "Every page you see here mirrors what a regular Admin sees for their campus — students, classes, teachers, payments, and more — but you can view and manage any campus from one place.",
        ],
      },
      {
        heading: "Switching Campuses",
        body: [
          "Click on a campus in the rail at the top of the sidebar to load that campus's data. The page you are on will reload with that campus's information.",
        ],
      },
    ],
  },
  {
    id: "super-admin-only",
    title: "Super Admin Exclusive Pages",
    icon: "🛡️",
    content: [
      {
        heading: "Managing Admins",
        body: [
          "The Admins page (visible only to you) lets you create, edit, or terminate admin accounts for any campus.",
          "Use Terminate Role if you need to revoke an admin's access without deleting their account or historical data — this is reversible.",
        ],
      },
      {
        heading: "Managing Campuses",
        body: [
          "The Campuses page lets you add new campuses or edit existing ones, including their display color used throughout the system.",
        ],
      },
      {
        heading: "Global Settings",
        body: [
          "The Settings page contains platform-wide options that apply across all campuses.",
        ],
      },
    ],
  },
  {
    id: "students-teachers",
    title: "Students & Teachers",
    icon: "👥",
    content: [
      {
        heading: "Cross-Campus Management",
        body: [
          "Students and Teachers pages work exactly like the Admin portal, but scoped to whichever campus you have selected.",
          "You can register, edit, withdraw, terminate, or delete records for any campus from here.",
        ],
      },
    ],
  },
  {
    id: "classes-courses",
    title: "Classes & Courses",
    icon: "📚",
    content: [
      {
        heading: "Viewing Class Data Across Campuses",
        body: [
          "Use the Classes and Courses pages with the campus switcher to compare class capacity, schedules, and course performance between campuses.",
        ],
      },
    ],
  },
  {
    id: "finance",
    title: "Payments & Remaining",
    icon: "💳",
    content: [
      {
        heading: "Financial Oversight",
        body: [
          "The Payments and Remaining pages show revenue and outstanding balances for the selected campus, with the same filtering tools available in the Admin portal.",
        ],
      },
    ],
  },
  {
    id: "certificates",
    title: "Certificates",
    icon: "🎓",
    content: [
      {
        heading: "Certificate Workflow",
        body: [
          "Claiming, editing, marking as done, and delivering certificates works the same as in the Admin portal — just remember to check which campus is selected first.",
        ],
      },
    ],
  },
  {
    id: "reports",
    title: "Reports & Backup",
    icon: "🗄️",
    content: [
      {
        heading: "Exporting Data",
        body: [
          "Use Backup to export any section's data per campus, or Export All for a complete workbook. Reports gives you ready-made multi-sheet summaries.",
        ],
      },
    ],
  },
];
