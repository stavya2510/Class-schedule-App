"use client"

import { useState, useEffect } from "react"
import { Calendar, Check, X, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import type { Subject } from "@/app/page"

interface AttendanceRecord {
  id: string
  subjectId: string
  date: string
  status: "present" | "absent" | "late"
  notes?: string
}

interface ClassAttendance {
  id: string
  timeSlotId: string
  studentId: string
  date: string
  status: "present" | "absent"
}

interface AttendanceTrackerProps {
  subjects: Subject[]
  userRole?: "student" | "teacher"
  currentUser?: any
  onClose: () => void
}

export default function AttendanceTracker({
  subjects,
  userRole = "teacher",
  currentUser,
  onClose,
}: AttendanceTrackerProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [classAttendance, setClassAttendance] = useState<ClassAttendance[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [activeTab, setActiveTab] = useState("mark")
  const { toast } = useToast()

  // Load attendance records from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("attendance-records")
    const classAttendanceSaved = localStorage.getItem("class-attendance")
    if (saved) {
      setAttendanceRecords(JSON.parse(saved))
    }
    if (classAttendanceSaved) {
      setClassAttendance(JSON.parse(classAttendanceSaved))
    }
  }, [])

  // Save attendance records to localStorage
  const saveAttendanceRecords = (records: AttendanceRecord[]) => {
    localStorage.setItem("attendance-records", JSON.stringify(records))
    setAttendanceRecords(records)
  }

  // Mark attendance for a subject
  const markAttendance = (subjectId: string, status: "present" | "absent" | "late") => {
    if (userRole !== "teacher") {
      toast({
        title: "Permission denied",
        description: "Only teachers can mark attendance",
        variant: "destructive",
      })
      return
    }

    const existingRecord = attendanceRecords.find(
      (record) => record.subjectId === subjectId && record.date === selectedDate,
    )

    if (existingRecord) {
      // Update existing record
      const updatedRecords = attendanceRecords.map((record) =>
        record.id === existingRecord.id ? { ...record, status } : record,
      )
      saveAttendanceRecords(updatedRecords)
    } else {
      // Create new record
      const newRecord: AttendanceRecord = {
        id: `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        subjectId,
        date: selectedDate,
        status,
      }
      saveAttendanceRecords([...attendanceRecords, newRecord])
    }

    toast({
      title: "Attendance marked!",
      description: `Marked as ${status} for ${subjects.find((s) => s.id === subjectId)?.name}`,
    })
  }

  // Calculate attendance statistics for a subject
  const getAttendanceStats = (subjectId: string) => {
    let subjectRecords = []

    if (userRole === "student" && currentUser) {
      // For students, show their personal attendance from class attendance
      subjectRecords = classAttendance.filter(
        (record) => record.studentId === currentUser.id && subjects.find((s) => s.id === subjectId),
      )
    } else {
      // For teachers, show general attendance records
      subjectRecords = attendanceRecords.filter((record) => record.subjectId === subjectId)
    }

    const totalClasses = subjectRecords.length
    const presentClasses = subjectRecords.filter((record) => record.status === "present").length
    const lateClasses = subjectRecords.filter((record) => record.status === "late").length
    const absentClasses = subjectRecords.filter((record) => record.status === "absent").length

    const attendancePercentage =
      totalClasses > 0 ? Math.round(((presentClasses + lateClasses * 0.5) / totalClasses) * 100) : 0

    return {
      totalClasses,
      presentClasses,
      lateClasses,
      absentClasses,
      attendancePercentage,
    }
  }

  // Get overall attendance statistics
  const getOverallStats = () => {
    let totalRecords = []

    if (userRole === "student" && currentUser) {
      totalRecords = classAttendance.filter((record) => record.studentId === currentUser.id)
    } else {
      totalRecords = attendanceRecords
    }

    const presentRecords = totalRecords.filter((record) => record.status === "present").length
    const lateRecords = totalRecords.filter((record) => record.status === "late").length
    const absentRecords = totalRecords.filter((record) => record.status === "absent").length

    const overallPercentage =
      totalRecords.length > 0 ? Math.round(((presentRecords + lateRecords * 0.5) / totalRecords.length) * 100) : 0

    return {
      totalRecords: totalRecords.length,
      presentRecords,
      lateRecords,
      absentRecords,
      overallPercentage,
    }
  }

  // Get attendance status for a subject on selected date
  const getAttendanceStatus = (subjectId: string) => {
    if (userRole === "student" && currentUser) {
      // For students, check their personal attendance
      const record = classAttendance.find(
        (record) => record.studentId === currentUser.id && record.date === selectedDate,
      )
      return record?.status
    } else {
      // For teachers, check general attendance
      const record = attendanceRecords.find((record) => record.subjectId === subjectId && record.date === selectedDate)
      return record?.status
    }
  }

  // Get recent attendance records
  const getRecentRecords = () => {
    let records = []

    if (userRole === "student" && currentUser) {
      records = classAttendance
        .filter((record) => record.studentId === currentUser.id)
        .map((record) => ({
          ...record,
          subjectId: subjects[0]?.id || "", // This would need proper mapping in real app
        }))
    } else {
      records = attendanceRecords
    }

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
  }

  const overallStats = getOverallStats()
  const recentRecords = getRecentRecords()

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-gradient-to-br from-white to-blue-50 border-0 shadow-2xl">
        <div id="attendance-tracker-description" className="sr-only">
          Track your class attendance with statistics and percentage calculations
        </div>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <Calendar className="w-6 h-6 text-blue-600" />
            Attendance Tracker
            {userRole === "student" && currentUser && (
              <Badge variant="secondary" className="ml-2">
                {currentUser.name}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="mark" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              {userRole === "teacher" ? "Mark Attendance" : "View Attendance"}
            </TabsTrigger>
            <TabsTrigger
              value="statistics"
              className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
            >
              Statistics
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mark" className="space-y-4">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{userRole === "teacher" ? "Mark Attendance" : "Your Attendance"}</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-1 border-2 rounded-md bg-white/70 backdrop-blur-sm focus:border-blue-500"
                    disabled={userRole === "student"}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjects.map((subject) => {
                    const currentStatus = getAttendanceStatus(subject.id)
                    const stats = getAttendanceStats(subject.id)

                    return (
                      <Card key={subject.id} className="relative bg-white/80 backdrop-blur-sm border-0 shadow-md">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{ backgroundColor: subject.color }}
                            ></div>
                            <div className="flex-1">
                              <CardTitle className="text-lg">{subject.name}</CardTitle>
                              <p className="text-sm text-gray-500">
                                {stats.attendancePercentage}% attendance ({stats.totalClasses} classes)
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => markAttendance(subject.id, "present")}
                              size="sm"
                              variant={currentStatus === "present" ? "default" : "outline"}
                              className="flex-1 shadow-sm"
                              disabled={userRole !== "teacher"}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Present
                            </Button>
                            <Button
                              onClick={() => markAttendance(subject.id, "late")}
                              size="sm"
                              variant={currentStatus === "late" ? "default" : "outline"}
                              className="flex-1 shadow-sm"
                              disabled={userRole !== "teacher"}
                            >
                              <TrendingUp className="w-4 h-4 mr-1" />
                              Late
                            </Button>
                            <Button
                              onClick={() => markAttendance(subject.id, "absent")}
                              size="sm"
                              variant={currentStatus === "absent" ? "destructive" : "outline"}
                              className="flex-1 shadow-sm"
                              disabled={userRole !== "teacher"}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Absent
                            </Button>
                          </div>
                          {currentStatus && (
                            <div className="mt-3 text-center">
                              <Badge
                                variant={
                                  currentStatus === "present"
                                    ? "default"
                                    : currentStatus === "late"
                                      ? "secondary"
                                      : "destructive"
                                }
                                className="shadow-sm"
                              >
                                {userRole === "student" ? "You were" : "Marked as"} {currentStatus}
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Overall Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {overallStats.overallPercentage}%
                  </div>
                  <Progress value={overallStats.overallPercentage} className="mt-2" />
                  <p className="text-xs text-gray-500 mt-1">{overallStats.totalRecords} total classes</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Present</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {overallStats.presentRecords}
                  </div>
                  <p className="text-xs text-gray-500">classes attended</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Late</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {overallStats.lateRecords}
                  </div>
                  <p className="text-xs text-gray-500">late arrivals</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Absent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{overallStats.absentRecords}</div>
                  <p className="text-xs text-gray-500">classes missed</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Subject-wise Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subjects.map((subject) => {
                    const stats = getAttendanceStats(subject.id)
                    return (
                      <div key={subject.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }}></div>
                            <span className="font-medium">{subject.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">{stats.attendancePercentage}%</span>
                            <p className="text-xs text-gray-500">
                              {stats.presentClasses + stats.lateClasses}/{stats.totalClasses} classes
                            </p>
                          </div>
                        </div>
                        <Progress value={stats.attendancePercentage} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Present: {stats.presentClasses}</span>
                          <span>Late: {stats.lateClasses}</span>
                          <span>Absent: {stats.absentClasses}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Recent Attendance Records</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {recentRecords.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No attendance records yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentRecords.map((record) => {
                        const subject = subjects.find((s) => s.id === record.subjectId)
                        return (
                          <div
                            key={record.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: subject?.color || "#gray" }}
                              ></div>
                              <div>
                                <p className="font-medium">{subject?.name || "Unknown Subject"}</p>
                                <p className="text-sm text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <Badge
                              variant={
                                record.status === "present"
                                  ? "default"
                                  : record.status === "late"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {record.status}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
