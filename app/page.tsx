"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Calendar,
  BookOpen,
  MessageCircle,
  Share2,
  Bell,
  Users,
  Database,
  FileText,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import TimetableGrid from "@/components/timetable-grid"
import SubjectManager from "@/components/subject-manager"
import AssignmentManager from "@/components/assignment-manager"
import AIChatBot from "@/components/ai-chat-bot"
import ShareSchedule from "@/components/share-schedule"
import SharedScheduleGallery from "@/components/shared-schedule-gallery"
import BackupManager from "@/components/backup-manager"
import { initializeFirebase, getScheduleData, saveScheduleData, trackAppUsage } from "@/lib/firebase-utils"
import NotificationCenter from "@/components/notification-center"
import NotificationBadge from "@/components/notification-badge"
import ReminderService from "@/components/reminder-service"
import { useNotifications } from "@/hooks/use-notifications"
import AttendanceTracker from "@/components/attendance-tracker"
import PracticeTest from "@/components/practice-test"
import RoleSelector from "@/components/role-selector"
import AcademicCalendar from "@/components/academic-calendar"
import PDFDocumentManager from "@/components/pdf-document-manager"
import StudentListManager from "@/components/student-list-manager"

export interface Subject {
  id: string
  name: string
  color: string
  instructor: string
  room: string
}

export interface TimeSlot {
  id: string
  subjectId: string
  day: string
  startTime: string
  endTime: string
}

export interface Assignment {
  id: string
  subjectId: string
  title: string
  description: string
  dueDate: string
  type: "assignment" | "homework" | "exam"
  completed: boolean
}

export default function ClassScheduleApp() {
  const [userRole, setUserRole] = useState<"student" | "teacher" | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [showSubjectManager, setShowSubjectManager] = useState(false)
  const [showAssignmentManager, setShowAssignmentManager] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [showShareSchedule, setShowShareSchedule] = useState(false)
  const [showScheduleGallery, setShowScheduleGallery] = useState(false)
  const [showBackupManager, setShowBackupManager] = useState(false)
  const [activeTab, setActiveTab] = useState("timetable")
  const [showNotificationCenter, setShowNotificationCenter] = useState(false)
  const { requestPermission, permission } = useNotifications()
  const [showAttendanceTracker, setShowAttendanceTracker] = useState(false)
  const [showPracticeTest, setShowPracticeTest] = useState(false)
  const [showAcademicCalendar, setShowAcademicCalendar] = useState(false)
  const [showPDFManager, setShowPDFManager] = useState(false)
  const [showStudentList, setShowStudentList] = useState(false)

  // Load user data from localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem("user-role") as "student" | "teacher" | null
    const savedUser = localStorage.getItem("current-user")
    if (savedRole && savedUser) {
      setUserRole(savedRole)
      setCurrentUser(JSON.parse(savedUser))
    }
  }, [])

  // Handle role and user data selection
  const handleRoleSelect = (role: "student" | "teacher", userData: any) => {
    setUserRole(role)
    setCurrentUser(userData)
    localStorage.setItem("user-role", role)
    localStorage.setItem("current-user", JSON.stringify(userData))

    // For students, add them to the logged students list
    if (role === "student") {
      const loggedStudents = JSON.parse(localStorage.getItem("logged-students") || "[]")
      const existingStudent = loggedStudents.find((s: any) => s.id === userData.id)

      if (!existingStudent) {
        const studentData = {
          ...userData,
          loginTime: new Date().toISOString(),
          isOnline: true,
        }
        loggedStudents.push(studentData)
        localStorage.setItem("logged-students", JSON.stringify(loggedStudents))
      } else {
        // Update existing student as online
        const updatedStudents = loggedStudents.map((s: any) =>
          s.id === userData.id ? { ...s, isOnline: true, loginTime: new Date().toISOString() } : s,
        )
        localStorage.setItem("logged-students", JSON.stringify(updatedStudents))
      }
    }
  }

  // Switch role
  const switchRole = () => {
    // Mark current student as offline if switching from student
    if (userRole === "student" && currentUser) {
      const loggedStudents = JSON.parse(localStorage.getItem("logged-students") || "[]")
      const updatedStudents = loggedStudents.map((s: any) => (s.id === currentUser.id ? { ...s, isOnline: false } : s))
      localStorage.setItem("logged-students", JSON.stringify(updatedStudents))
    }

    setUserRole(null)
    setCurrentUser(null)
    localStorage.removeItem("user-role")
    localStorage.removeItem("current-user")
  }

  useEffect(() => {
    if (userRole) {
      initializeFirebase()
      loadData()
      trackAppUsage("app_opened", { role: userRole })
    }
  }, [userRole])

  // Handle page unload to mark student as offline
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (userRole === "student" && currentUser) {
        const loggedStudents = JSON.parse(localStorage.getItem("logged-students") || "[]")
        const updatedStudents = loggedStudents.map((s: any) =>
          s.id === currentUser.id ? { ...s, isOnline: false } : s,
        )
        localStorage.setItem("logged-students", JSON.stringify(updatedStudents))
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [userRole, currentUser])

  const loadData = async () => {
    try {
      const data = await getScheduleData()
      if (data) {
        setSubjects(data.subjects || [])
        setTimeSlots(data.timeSlots || [])
        setAssignments(data.assignments || [])
      }
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const saveData = async () => {
    try {
      await saveScheduleData({ subjects, timeSlots, assignments })
    } catch (error) {
      console.error("Error saving data:", error)
    }
  }

  useEffect(() => {
    if (subjects.length > 0 || timeSlots.length > 0 || assignments.length > 0) {
      saveData()
    }
  }, [subjects, timeSlots, assignments])

  const addSubject = (subject: Omit<Subject, "id">) => {
    const newSubject = { ...subject, id: Date.now().toString() }
    setSubjects([...subjects, newSubject])
    trackAppUsage("subject_added", { subjectName: subject.name })
  }

  const updateSubject = (id: string, updatedSubject: Omit<Subject, "id">) => {
    setSubjects(subjects.map((s) => (s.id === id ? { ...updatedSubject, id } : s)))
    trackAppUsage("subject_updated")
  }

  const deleteSubject = (id: string) => {
    setSubjects(subjects.filter((s) => s.id !== id))
    setTimeSlots(timeSlots.filter((ts) => ts.subjectId !== id))
    setAssignments(assignments.filter((a) => a.subjectId !== id))
    trackAppUsage("subject_deleted")
  }

  const addTimeSlot = (timeSlot: Omit<TimeSlot, "id">) => {
    const newTimeSlot = { ...timeSlot, id: Date.now().toString() }
    setTimeSlots([...timeSlots, newTimeSlot])
    trackAppUsage("timeslot_added")
  }

  const deleteTimeSlot = (id: string) => {
    setTimeSlots(timeSlots.filter((ts) => ts.id !== id))
    trackAppUsage("timeslot_deleted")
  }

  const addAssignment = (assignment: Omit<Assignment, "id">) => {
    const newAssignment = { ...assignment, id: Date.now().toString() }
    setAssignments([...assignments, newAssignment])
    trackAppUsage("assignment_added", { type: assignment.type })
  }

  const updateAssignment = (id: string, updatedAssignment: Partial<Assignment>) => {
    setAssignments(assignments.map((a) => (a.id === id ? { ...a, ...updatedAssignment } : a)))
    if (updatedAssignment.completed !== undefined) {
      trackAppUsage("assignment_completed", { completed: updatedAssignment.completed })
    }
  }

  const deleteAssignment = (id: string) => {
    setAssignments(assignments.filter((a) => a.id !== id))
    trackAppUsage("assignment_deleted")
  }

  const handleImportSchedule = (importedSubjects: Subject[], importedTimeSlots: TimeSlot[]) => {
    // Generate new IDs to avoid conflicts
    const newSubjects = importedSubjects.map((s) => ({ ...s, id: `imported_${Date.now()}_${Math.random()}` }))
    const subjectIdMap = new Map(importedSubjects.map((s, i) => [s.id, newSubjects[i].id]))

    const newTimeSlots = importedTimeSlots.map((ts) => ({
      ...ts,
      id: `imported_${Date.now()}_${Math.random()}`,
      subjectId: subjectIdMap.get(ts.subjectId) || ts.subjectId,
    }))

    setSubjects([...subjects, ...newSubjects])
    setTimeSlots([...timeSlots, ...newTimeSlots])
    trackAppUsage("schedule_imported", { subjectsCount: newSubjects.length, timeSlotsCount: newTimeSlots.length })
  }

  const upcomingAssignments = assignments
    .filter((a) => !a.completed && new Date(a.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5)

  const todaySchedule = timeSlots.filter((ts) => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" })
    return ts.day === today
  })

  // Request notification permission on first visit
  useEffect(() => {
    const hasAskedPermission = localStorage.getItem("notification-permission-asked")
    if (!hasAskedPermission && subjects.length > 0) {
      setTimeout(() => {
        requestPermission()
        localStorage.setItem("notification-permission-asked", "true")
      }, 3000) // Ask after 3 seconds
    }
  }, [subjects.length, requestPermission])

  // Show role selector if no role is selected
  if (!userRole) {
    return <RoleSelector onRoleSelect={handleRoleSelect} />
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500">
        <div className="absolute inset-0 bg-gradient-to-tl from-cyan-400 via-blue-500 to-purple-600 opacity-70"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-red-500 to-yellow-500 opacity-50"></div>
      </div>

      {/* Abstract Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-1/3 right-32 w-32 h-32 bg-yellow-300/20 rounded-full blur-xl animate-bounce"></div>
        <div className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-pink-300/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-blue-300/20 rounded-full blur-2xl animate-bounce"></div>

        {/* Study Icons */}
        <div className="absolute top-1/4 left-1/2 opacity-5">
          <BookOpen className="w-20 h-20 text-white animate-float" />
        </div>
        <div className="absolute bottom-1/4 right-1/2 opacity-5">
          <Users className="w-16 h-16 text-white animate-float" style={{ animationDelay: "2s" }} />
        </div>
        <div className="absolute top-1/2 left-1/4 opacity-5">
          <Calendar className="w-18 h-18 text-white animate-float" style={{ animationDelay: "1s" }} />
        </div>
      </div>

      <div className="relative z-10 p-4">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-4xl font-bold text-white drop-shadow-2xl">Class Schedule & Reminder</h1>
                  <Badge
                    variant={userRole === "teacher" ? "default" : "secondary"}
                    className="text-sm bg-white/20 backdrop-blur-sm border-white/30 text-white shadow-lg"
                  >
                    {userRole === "teacher" ? "Teacher" : "Student"}: {currentUser?.name}
                  </Badge>
                </div>
                <p className="text-white/90 drop-shadow-lg">Manage your academic life efficiently</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Role-specific top buttons */}
                {userRole === "teacher" ? (
                  <>
                    <NotificationBadge onClick={() => setShowNotificationCenter(true)} />
                    <Button
                      onClick={() => setShowStudentList(true)}
                      variant="outline"
                      className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 shadow-lg"
                    >
                      <Users className="w-4 h-4" />
                      Students
                    </Button>
                    <Button
                      onClick={() => setShowScheduleGallery(true)}
                      variant="outline"
                      className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 shadow-lg"
                    >
                      <Users className="w-4 h-4" />
                      Gallery
                    </Button>
                    <Button
                      onClick={() => setShowShareSchedule(true)}
                      variant="outline"
                      className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 shadow-lg"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => setShowAIChat(true)}
                      variant="outline"
                      className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 shadow-lg"
                    >
                      <MessageCircle className="w-4 h-4" />
                      AI Tutor
                    </Button>
                    <Button
                      onClick={() => setShowBackupManager(true)}
                      variant="outline"
                      className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 shadow-lg"
                    >
                      <Database className="w-4 h-4" />
                      Backup
                    </Button>
                    <NotificationBadge onClick={() => setShowNotificationCenter(true)} />
                  </>
                )}

                <Button
                  onClick={switchRole}
                  variant="outline"
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 shadow-lg"
                >
                  <Settings className="w-4 h-4" />
                  Switch Role
                </Button>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <BookOpen className="w-5 h-5 text-blue-300" />
                  Subjects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-300 mb-2 drop-shadow-lg">{subjects.length}</div>
                {userRole === "teacher" && (
                  <Button
                    onClick={() => setShowSubjectManager(true)}
                    size="sm"
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subject
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Calendar className="w-5 h-5 text-green-300" />
                  Today's Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-300 mb-2 drop-shadow-lg">{todaySchedule.length}</div>
                <p className="text-sm text-white/80">Classes scheduled</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Bell className="w-5 h-5 text-orange-300" />
                  Pending Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-300 mb-2 drop-shadow-lg">
                  {assignments.filter((a) => !a.completed).length}
                </div>
                {userRole === "teacher" && (
                  <Button
                    onClick={() => setShowAssignmentManager(true)}
                    size="sm"
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-300 mb-2 drop-shadow-lg">
                  {assignments.length > 0
                    ? Math.round((assignments.filter((a) => a.completed).length / assignments.length) * 100)
                    : 0}
                  %
                </div>
                <p className="text-sm text-white/80">Tasks completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional action buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <Button
              onClick={() => setShowAttendanceTracker(true)}
              variant="outline"
              className="flex items-center gap-2 h-12 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 shadow-lg"
            >
              <Calendar className="w-4 h-4" />
              Attendance
            </Button>

            <Button
              onClick={() => setShowPracticeTest(true)}
              variant="outline"
              className="flex items-center gap-2 h-12 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 shadow-lg"
            >
              <BookOpen className="w-4 h-4" />
              {userRole === "student" ? "Practice Tests" : "Create Tests"}
            </Button>

            <Button
              onClick={() => setShowAcademicCalendar(true)}
              variant="outline"
              className="flex items-center gap-2 h-12 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 shadow-lg"
            >
              <Calendar className="w-4 h-4" />
              Academic Calendar
            </Button>

            <Button
              onClick={() => setShowPDFManager(true)}
              variant="outline"
              className="flex items-center gap-2 h-12 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 shadow-lg"
            >
              <FileText className="w-4 h-4" />
              Study Materials
            </Button>

            {userRole === "teacher" && (
              <>
                <Button
                  onClick={() => setShowSubjectManager(true)}
                  variant="outline"
                  className="flex items-center gap-2 h-12 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Manage Subjects
                </Button>
                <Button
                  onClick={() => setShowAssignmentManager(true)}
                  variant="outline"
                  className="flex items-center gap-2 h-12 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Manage Tasks
                </Button>
              </>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-sm border-white/20 shadow-lg">
              <TabsTrigger
                value="timetable"
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80"
              >
                Weekly Timetable
              </TabsTrigger>
              <TabsTrigger
                value="assignments"
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80"
              >
                Assignments & Tasks
              </TabsTrigger>
              <TabsTrigger
                value="reminders"
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80"
              >
                Upcoming Reminders
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timetable">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-white">Weekly Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <TimetableGrid
                    subjects={subjects}
                    timeSlots={timeSlots}
                    onAddTimeSlot={userRole === "teacher" ? addTimeSlot : () => {}}
                    onDeleteTimeSlot={userRole === "teacher" ? deleteTimeSlot : () => {}}
                    userRole={userRole}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-white">Pending Assignments</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {assignments
                      .filter((a) => !a.completed)
                      .map((assignment) => {
                        const subject = subjects.find((s) => s.id === assignment.subjectId)
                        const daysUntilDue = Math.ceil(
                          (new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                        )

                        return (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  style={{ backgroundColor: subject?.color || "#gray" }}
                                  className="text-white shadow-sm"
                                >
                                  {subject?.name || "Unknown"}
                                </Badge>
                                <Badge
                                  variant={assignment.type === "exam" ? "destructive" : "secondary"}
                                  className="shadow-sm"
                                >
                                  {assignment.type}
                                </Badge>
                              </div>
                              <h4 className="font-semibold text-white">{assignment.title}</h4>
                              <p className="text-sm text-white/80">{assignment.description}</p>
                              <p className="text-sm text-white/70 mt-1">
                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                {daysUntilDue >= 0 && (
                                  <span
                                    className={`ml-2 ${daysUntilDue <= 1 ? "text-red-300 font-semibold" : "text-white/70"}`}
                                  >
                                    ({daysUntilDue === 0 ? "Due today" : `${daysUntilDue} days left`})
                                  </span>
                                )}
                              </p>
                            </div>
                            {userRole === "student" && (
                              <Button
                                onClick={() => updateAssignment(assignment.id, { completed: true })}
                                size="sm"
                                variant="outline"
                                className="bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-lg"
                              >
                                Mark Done
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    {assignments.filter((a) => !a.completed).length === 0 && (
                      <p className="text-center text-white/70 py-8">No pending assignments</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-white">Completed Assignments</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {assignments
                      .filter((a) => a.completed)
                      .slice(0, 5)
                      .map((assignment) => {
                        const subject = subjects.find((s) => s.id === assignment.subjectId)

                        return (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between p-4 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-lg shadow-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  style={{ backgroundColor: subject?.color || "#gray" }}
                                  className="text-white shadow-sm"
                                >
                                  {subject?.name || "Unknown"}
                                </Badge>
                                <Badge variant="secondary" className="shadow-sm">
                                  {assignment.type}
                                </Badge>
                              </div>
                              <h4 className="font-semibold text-green-100">{assignment.title}</h4>
                              <p className="text-sm text-green-200">Completed ✓</p>
                            </div>
                          </div>
                        )
                      })}
                    {assignments.filter((a) => a.completed).length === 0 && (
                      <p className="text-center text-white/70 py-8">No completed assignments yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reminders">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-white">Upcoming Reminders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingAssignments.map((assignment) => {
                      const subject = subjects.find((s) => s.id === assignment.subjectId)
                      const daysUntilDue = Math.ceil(
                        (new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                      )

                      return (
                        <div
                          key={assignment.id}
                          className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg"
                        >
                          <div
                            className="w-2 h-12 rounded shadow-sm"
                            style={{ backgroundColor: subject?.color || "#gray" }}
                          ></div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">{assignment.title}</h4>
                            <p className="text-sm text-white/80">
                              {subject?.name} - {assignment.type}
                            </p>
                            <p className="text-sm text-white/70">
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-lg font-bold drop-shadow-lg ${daysUntilDue <= 1 ? "text-red-300" : "text-white"}`}
                            >
                              {daysUntilDue === 0 ? "Today" : `${daysUntilDue} days`}
                            </div>
                            <p className="text-sm text-white/70">remaining</p>
                          </div>
                        </div>
                      )
                    })}
                    {upcomingAssignments.length === 0 && (
                      <p className="text-center text-white/70 py-8">No upcoming reminders</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Dialogs and Modals */}
          {showSubjectManager && userRole === "teacher" && (
            <SubjectManager
              subjects={subjects}
              onAddSubject={addSubject}
              onUpdateSubject={updateSubject}
              onDeleteSubject={deleteSubject}
              onClose={() => setShowSubjectManager(false)}
            />
          )}

          {showAssignmentManager && userRole === "teacher" && (
            <AssignmentManager
              subjects={subjects}
              assignments={assignments}
              onAddAssignment={addAssignment}
              onUpdateAssignment={updateAssignment}
              onDeleteAssignment={deleteAssignment}
              onClose={() => setShowAssignmentManager(false)}
            />
          )}

          {showAIChat && userRole === "student" && <AIChatBot onClose={() => setShowAIChat(false)} />}

          {showShareSchedule && userRole === "teacher" && (
            <ShareSchedule subjects={subjects} timeSlots={timeSlots} onClose={() => setShowShareSchedule(false)} />
          )}

          {showScheduleGallery && userRole === "teacher" && (
            <SharedScheduleGallery
              isOpen={showScheduleGallery}
              onClose={() => setShowScheduleGallery(false)}
              onImportSchedule={handleImportSchedule}
            />
          )}

          {showBackupManager && userRole === "student" && (
            <BackupManager
              isOpen={showBackupManager}
              onClose={() => setShowBackupManager(false)}
              onDataRestored={loadData}
            />
          )}

          {showAttendanceTracker && (
            <AttendanceTracker
              subjects={subjects}
              userRole={userRole}
              currentUser={currentUser}
              onClose={() => setShowAttendanceTracker(false)}
            />
          )}

          {showPracticeTest && (
            <PracticeTest
              subjects={subjects}
              userRole={userRole}
              currentUser={currentUser}
              onClose={() => setShowPracticeTest(false)}
            />
          )}

          {showAcademicCalendar && (
            <AcademicCalendar userRole={userRole} onClose={() => setShowAcademicCalendar(false)} />
          )}

          {showPDFManager && (
            <PDFDocumentManager subjects={subjects} userRole={userRole} onClose={() => setShowPDFManager(false)} />
          )}

          {showStudentList && userRole === "teacher" && (
            <StudentListManager onClose={() => setShowStudentList(false)} />
          )}
        </div>

        <ReminderService subjects={subjects} timeSlots={timeSlots} assignments={assignments} />

        {showNotificationCenter && (
          <NotificationCenter
            isOpen={showNotificationCenter}
            onClose={() => setShowNotificationCenter(false)}
            subjects={subjects}
            timeSlots={timeSlots}
          />
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
