import {
  BookOpen,
  Users,
  UserCheck,
  MonitorPlay,
  CalendarDays,
  FolderLock,
  Megaphone,
  Calendar,
  CreditCard,
  MessageSquare,
  GraduationCap,
  LayoutDashboard,
} from "lucide-react";

export function getDashboardRoleFlags(userData) {
  const role = userData?.role || userData?.your_role;

  return {
    role,
    isAdmin: role === "Admin",
    isTeacher: role === "Teacher",
    isParent: role === "Parent",
    isStudent: role === "Student",
  };
}

export function getDashboardNavItems(flags) {
  const { isAdmin, isTeacher, isParent, isStudent } = flags;

  return [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      show: isAdmin || isStudent,
    },
    {
      id: "subjects",
      label: isAdmin || isTeacher ? "Manage Subjects" : "My Subjects",
      icon: BookOpen,
      show: !isParent,
    },
    { id: "students", label: "Students", icon: Users, show: isAdmin },
    {
      id: "attendance",
      label: "Roll Call",
      icon: UserCheck,
      show: isAdmin || isTeacher,
    },
    { id: "cbt", label: "CBT Exams", icon: MonitorPlay, show: !isParent },
    { id: "timetable", label: "Timetable", icon: CalendarDays, show: true },
    {
      id: "grades",
      label:
        isAdmin || isTeacher
          ? "Grades & Reports"
          : isParent
            ? "Child's Report Card"
            : "My Report Card",
      icon: GraduationCap,
      show: true,
    },
    { id: "finance", label: "Billing", icon: CreditCard, show: !isTeacher },
    { id: "vault", label: "Vault", icon: FolderLock, show: true },
    { id: "calendar", label: "Calendar", icon: Calendar, show: true },
    { id: "broadcast", label: "Broadcast", icon: Megaphone, show: isAdmin },
    { id: "chat", label: "Live Chat", icon: MessageSquare, show: true },
  ];
}

export const NAV_CATEGORIES = {
  Academics: ["overview", "subjects", "timetable", "cbt", "grades"],
  Administration: ["students", "attendance", "finance"],
  Workspace: ["vault", "calendar", "broadcast", "chat"],
};

export function getTabDescription(activeTab, { isAdmin, isStudent }) {
  if (activeTab === "overview") {
    return isAdmin
      ? "Track performance, monitor school operations, and stay on top of activity from one central workspace."
      : "View your academic activity, schedule, and important updates from your personalized dashboard.";
  }

  const descriptions = {
    subjects:
      "Manage academic subjects, upload learning modules, and keep classroom resources organized.",
    students:
      "Review student records, enroll new learners, and manage parent connections.",
    attendance:
      "Record class attendance quickly and maintain accurate daily participation records.",
    cbt:
      "Create and manage computer-based tests with structured questions and exam settings.",
    timetable:
      "View and organize the academic schedule for classes, sessions, and learning activities.",
    grades:
      "Manage assessments, review report cards, and keep academic performance records up to date.",
    finance:
      "Generate invoices, monitor billing, and manage payment-related school operations.",
    vault:
      "Securely store, access, and manage official school files and administrative documents.",
    calendar:
      "Track upcoming events, academic activities, and important dates across the school.",
    broadcast:
      "Send announcements and important updates to the right audience quickly and clearly.",
    chat:
      "Communicate in real time with staff, students, or other school stakeholders.",
  };

  return descriptions[activeTab] || (isStudent ? "Your workspace is ready." : "School workspace is ready.");
}
