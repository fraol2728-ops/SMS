import type { DocsSection } from "@/components/shared/docs/DocsLayout";

export const adminDocs: DocsSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "👋",
    content: [
      {
        heading: "Welcome to the Admin Portal",
        body: [
          "This portal is where you manage everything happening at your campus: students, teachers, classes, payments, certificates, and more.",
          "Use the sidebar on the left to navigate between sections. You can collapse the sidebar by clicking the arrow at the bottom to get more screen space.",
        ],
      },
      {
        heading: "Your Dashboard",
        body: [
          "The dashboard gives you a quick snapshot of your campus: total students, active classes, monthly revenue, outstanding balances, attendance rate, and certificates waiting to be delivered.",
          "Classes currently open for registration are shown at the top — click any class card to jump straight to it.",
          "Click the gear icon in the top header to customize which cards appear on your dashboard.",
        ],
      },
    ],
  },
  {
    id: "students",
    title: "Managing Students",
    icon: "👥",
    content: [
      {
        heading: "Adding a New Student",
        body: [
          "Go to Students → Add Student. Fill in personal details, choose a class, and record the initial payment.",
          "You can scan a Fayda National ID card to auto-fill the student's name, gender, and date of birth instead of typing manually.",
          "A profile photo is optional — you can add one during registration or later from the edit page.",
          "If the student is not paying the full course fee upfront, the remaining balance and due date are calculated automatically based on their registration date.",
        ],
      },
      {
        heading: "Viewing and Filtering Students",
        body: [
          "The Students page lists everyone registered at your campus. Use the filter panel to narrow down by gender, course, class type, or payment status.",
          "The analytics section above the list shows how many students are enrolled per course — click any course bar to filter instantly.",
          "Click any student row to open their full profile.",
        ],
      },
      {
        heading: "Student Profile Page",
        body: [
          "Each student profile shows attendance rate, total paid, days remaining until their balance is due, and their current class.",
          "If they have an outstanding balance, you can record a new payment directly from this page — it updates their progress bar instantly.",
          "From here you can also edit their details, claim a certificate, withdraw them temporarily, change their class, terminate their portal access, or permanently delete their record.",
        ],
      },
      {
        heading: "Withdrawing a Student",
        body: [
          "Use the Withdraw button on a student's profile if they are pausing their studies. You can record the reason, an expected return date, and a contact number for the period they are away.",
          "Withdrawn students appear under the Withdrawn page and can be reactivated later.",
        ],
      },
    ],
  },
  {
    id: "teachers",
    title: "Managing Teachers",
    icon: "🧑‍🏫",
    content: [
      {
        heading: "Adding and Editing Teachers",
        body: [
          "Go to Teachers → Add Teacher to register a new instructor. A profile photo is optional.",
          "Click any teacher card to view their profile, including the classes they teach and their performance score.",
          "Use the Edit button on a teacher's profile to update their details or photo, or Delete to permanently remove their account.",
        ],
      },
      {
        heading: "Teacher Performance",
        body: [
          "Each teacher has a performance score out of 100, calculated from student ratings, positive/negative feedback, attendance rates in their classes, and student retention.",
          "Open a teacher's profile and click the Performance tab to see the full breakdown, along with what students say they love and what could improve.",
        ],
      },
    ],
  },
  {
    id: "classes",
    title: "Classes & Courses",
    icon: "📚",
    content: [
      {
        heading: "Course Catalog",
        body: [
          "The Courses page lists every course offered at your campus along with its duration, price, and how many active classes are currently running for it.",
        ],
      },
      {
        heading: "Managing Classes",
        body: [
          "The Classes page is organized by status: Registration (open for new students), Started, and Ended.",
          "Use the filters to narrow by course, class type, schedule, or time slot. The analytics section shows how students are distributed across courses, schedules, and time slots.",
          "Each class card shows a capacity bar — green means there is room, amber means it is nearly full, red means it is full.",
        ],
      },
    ],
  },
  {
    id: "payments",
    title: "Payments & Remaining Balances",
    icon: "💳",
    content: [
      {
        heading: "Payments Page",
        body: [
          "View every payment transaction at your campus. Filter by date range, payment status, or method, and search by student name.",
          "The KPI cards at the top show total revenue, this month's revenue, outstanding balances, and total transaction count.",
        ],
      },
      {
        heading: "Remaining Balances",
        body: [
          "The Remaining page lists every student who still owes money. Each entry shows how many days are left until the balance is due, calculated from the student's registration date.",
          "Overdue balances are highlighted in red, balances due soon in amber, and balances with plenty of time in green.",
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
        heading: "Recording and Reviewing Attendance",
        body: [
          "The Attendance page lets you navigate day by day using the arrows or the date picker.",
          "Records are grouped by class, showing how many students were present, absent, or late, along with an overall rate for that class on that day.",
          "Use the filters to focus on a single class or a specific attendance status.",
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
        heading: "Claiming a Certificate",
        body: [
          "From a student's profile, click Claim Certificate. The student's name and course are filled in automatically — add the Amharic name and receipt number, mark the certificate payment as pending or paid, and save.",
          "If the student has an outstanding course balance, you'll see a warning, but the certificate can still be created.",
        ],
      },
      {
        heading: "Certificate Statuses",
        body: [
          "Pending means the certificate has been claimed but not yet printed.",
          "Ready means you have marked it as done — the student is notified automatically and can see it is ready to collect.",
          "Delivered means the student has physically received it. You cannot mark a certificate as delivered if the student still owes money on their course.",
          "Use the filter tabs on the Certificates page to quickly see Pending, Ready, or Delivered certificates, and the stat cards at the top for a quick overview.",
        ],
      },
      {
        heading: "Editing a Certificate",
        body: [
          "Open any certificate and click Edit to correct the name, Amharic name, receipt number, payment status, or notes — useful if something was entered incorrectly when it was first claimed.",
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
        heading: "Viewing Feedback",
        body: [
          "Students submit feedback about their class, teacher, and any problems either from a dedicated page or when signing out of the student portal.",
          "The Feedback page shows average rating, the most commonly reported problems, and every individual feedback entry with its checkboxes and comments.",
          "Use Export to download all feedback as an Excel file.",
        ],
      },
    ],
  },
  {
    id: "backup",
    title: "Backup & Reports",
    icon: "🗄️",
    content: [
      {
        heading: "Exporting Data",
        body: [
          "The Backup page lets you export any section of your data (students, payments, classes, and more) to Excel individually, or use Export All to download everything as one workbook with separate sheets.",
          "The Reports page provides ready-made multi-sheet reports for deeper analysis.",
        ],
      },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    icon: "⚙️",
    content: [
      {
        heading: "Customizing Your Portal",
        body: [
          "Click the gear icon in the header to open Settings. From here you can choose which KPI cards appear on your dashboard, pick an accent color, set your preferred date format, and control notification preferences.",
          "Changes are saved immediately and apply the next time the dashboard loads.",
        ],
      },
    ],
  },
];
