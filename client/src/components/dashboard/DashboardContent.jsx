import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import SubjectsTab from "../SubjectsTab";
import StudentsTab from "../StudentsTab";
import GradesTab from "../GradesTab";
import SchoolVaultTab from "../SchoolVaultTab";
import AnalyticsCards from "../AnalyticsCards";
import AttendanceTab from "../AttendanceTab";
import BroadcastTab from "../BroadcastTab";
import CalendarTab from "../CalendarTab";
import FinanceTab from "../FinanceTab";
import ChatTab from "../ChatTab";
import CBTTab from "../CBTTab";
import TimetableTab from "../TimetableTab";
import StudentBento from "../StudentBento";

export default function DashboardContent({
  activeTab,
  flags,
  userData,
  subjects,
  setSubjects,
  students,
}) {
  const { isAdmin, isTeacher, isParent, isStudent } = flags;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full min-w-0"
      >
        {activeTab === "overview" && isAdmin && <AnalyticsCards />}
        {activeTab === "overview" && isStudent && <StudentBento userData={userData} />}

        {activeTab === "subjects" && !isParent && (
          <SubjectsTab
            isAdmin={isAdmin}
            isTeacher={isTeacher}
            subjects={subjects}
            setSubjects={setSubjects}
          />
        )}

        {activeTab === "students" && isAdmin && <StudentsTab isAdmin={isAdmin} />}

        {activeTab === "attendance" && (isAdmin || isTeacher) && (
          <AttendanceTab students={students} />
        )}

        {activeTab === "cbt" && !isParent && (
          <CBTTab
            isTeacher={isTeacher}
            isAdmin={isAdmin}
            isStudent={isStudent}
            subjects={subjects}
          />
        )}

        {activeTab === "timetable" && (
          <TimetableTab
            isAdmin={isAdmin}
            isStudent={isStudent}
            userData={userData}
            subjects={subjects}
          />
        )}

        {activeTab === "vault" && <SchoolVaultTab isAdmin={isAdmin} />}
        {activeTab === "broadcast" && <BroadcastTab isAdmin={isAdmin} isTeacher={isTeacher} />}
        {activeTab === "calendar" && <CalendarTab isAdmin={isAdmin} isTeacher={isTeacher} />}

        {activeTab === "finance" && !isTeacher && (
          <FinanceTab
            isAdmin={isAdmin}
            isParent={isParent}
            isStudent={isStudent}
            students={students}
          />
        )}

        {activeTab === "chat" && <ChatTab userData={userData} />}

        {activeTab === "grades" && (
          <GradesTab
            isAdmin={isAdmin}
            isTeacher={isTeacher}
            isParent={isParent}
            students={students}
            subjects={subjects}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
