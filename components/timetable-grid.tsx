"use client"

import { useState, useEffect } from "react"
import { Plus, X, Users, Check, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import type { Subject, TimeSlot } from "@/app/page"

interface TimetableGridProps {
  subjects: Subject[]
  timeSlots: TimeSlot[]
  onAddTimeSlot: (timeSlot: Omit<TimeSlot, "id">) => void
  onDeleteTimeSlot: (id: string) => void
  userRole?: "student" | "teacher"
}

interface Student {
  id: string
  name: string
  class: string
  isOnline: boolean
}

interface ClassAttendance {
  id: string
  timeSlotId: string
  studentId: string
  date: string
  status: "present" | "absent"
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const timeSlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
]

export default function TimetableGrid({
  subjects,
  timeSlots: scheduleSlots,
  onAddTimeSlot,
  onDeleteTimeSlot,
  userRole = "teacher",
}: TimetableGridProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showStudentsDialog, setShowStudentsDialog] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ day: string; time: string } | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [classAttendance, setClassAttendance] = useState<ClassAttendance[]>([])
  const [newSlot, setNewSlot] = useState({
    subjectId: "",
    startTime: "",
    endTime: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    // Load students and attendance from localStorage
    const loggedStudents = JSON.parse(localStorage.getItem("logged-students") || "[]")
    const savedAttendance = JSON.parse(localStorage.getItem("class-attendance") || "[]")
    setStudents(loggedStudents)
    setClassAttendance(savedAttendance)
  }, [])

  const handleCellClick = (day: string, time: string) => {
    const existingSlot = scheduleSlots.find((slot) => slot.day === day && slot.startTime <= time && slot.endTime > time)

    if (existingSlot) {
      if (userRole === "teacher") {
        // Show students in this class
        setSelectedTimeSlot(existingSlot)
        setShowStudentsDialog(true)
      }
    } else {
      // Only teachers can add time slots
      if (userRole === "teacher" && onAddTimeSlot.toString() !== "() => {}") {
        setSelectedCell({ day, time })
        setNewSlot({
          subjectId: "",
          startTime: time,
          endTime: String(Number.parseInt(time.split(":")[0]) + 1).padStart(2, "0") + ":00",
        })
        setShowAddDialog(true)
      }
    }
  }

  const handleAddSlot = () => {
    if (selectedCell && newSlot.subjectId) {
      onAddTimeSlot({
        subjectId: newSlot.subjectId,
        day: selectedCell.day,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
      })
      setShowAddDialog(false)
      setSelectedCell(null)
      setNewSlot({ subjectId: "", startTime: "", endTime: "" })
    }
  }

  const getSlotForCell = (day: string, time: string) => {
    return scheduleSlots.find((slot) => slot.day === day && slot.startTime <= time && slot.endTime > time)
  }

  const getSubjectForSlot = (slot: TimeSlot) => {
    return subjects.find((subject) => subject.id === slot.subjectId)
  }

  const getStudentsForTimeSlot = (timeSlot: TimeSlot) => {
    const subject = getSubjectForSlot(timeSlot)
    if (!subject) return []

    // For now, return all students - in a real app, you'd filter by class/subject
    return students
  }

  const markAttendance = (studentId: string, status: "present" | "absent") => {
    if (!selectedTimeSlot) return

    const today = new Date().toISOString().split("T")[0]
    const existingRecord = classAttendance.find(
      (record) => record.timeSlotId === selectedTimeSlot.id && record.studentId === studentId && record.date === today,
    )

    let updatedAttendance
    if (existingRecord) {
      updatedAttendance = classAttendance.map((record) =>
        record.id === existingRecord.id ? { ...record, status } : record,
      )
    } else {
      const newRecord: ClassAttendance = {
        id: `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timeSlotId: selectedTimeSlot.id,
        studentId,
        date: today,
        status,
      }
      updatedAttendance = [...classAttendance, newRecord]
    }

    setClassAttendance(updatedAttendance)
    localStorage.setItem("class-attendance", JSON.stringify(updatedAttendance))

    const student = students.find((s) => s.id === studentId)
    toast({
      title: "Attendance marked!",
      description: `${student?.name} marked as ${status}`,
    })
  }

  const getAttendanceStatus = (studentId: string) => {
    if (!selectedTimeSlot) return null
    const today = new Date().toISOString().split("T")[0]
    const record = classAttendance.find(
      (record) => record.timeSlotId === selectedTimeSlot.id && record.studentId === studentId && record.date === today,
    )
    return record?.status
  }

  const getStudentCount = (slot: TimeSlot) => {
    const studentsInClass = getStudentsForTimeSlot(slot)
    return studentsInClass.length
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-7 gap-1 mb-4">
          <div className="p-3 font-semibold text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg">
            Time
          </div>
          {days.map((day) => (
            <div
              key={day}
              className="p-3 font-semibold text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg"
            >
              {day}
            </div>
          ))}
        </div>

        {timeSlots.map((time) => (
          <div key={time} className="grid grid-cols-7 gap-1 mb-1">
            <div className="p-3 text-center bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg font-medium font-sans shadow-md">
              {time}
            </div>
            {days.map((day) => {
              const slot = getSlotForCell(day, time)
              const subject = slot ? getSubjectForSlot(slot) : null
              const studentCount = slot ? getStudentCount(slot) : 0

              return (
                <div
                  key={`${day}-${time}`}
                  className={`p-2 min-h-[80px] rounded-lg cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:scale-105 ${
                    slot && subject
                      ? "text-white font-medium shadow-lg"
                      : "bg-gradient-to-br from-white to-gray-50 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50"
                  }`}
                  style={{
                    background:
                      slot && subject ? `linear-gradient(135deg, ${subject.color}, ${subject.color}dd)` : undefined,
                  }}
                  onClick={() => handleCellClick(day, time)}
                >
                  {slot && subject ? (
                    <div className="relative h-full">
                      <div className="text-sm font-bold drop-shadow-sm">{subject.name}</div>
                      <div className="text-xs opacity-90 drop-shadow-sm">{subject.room}</div>
                      <div className="text-xs opacity-80 drop-shadow-sm">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      {studentCount > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3" />
                          <span className="text-xs">{studentCount}</span>
                        </div>
                      )}
                      {userRole === "teacher" && (
                        <X className="absolute top-0 right-0 w-4 h-4 opacity-70 hover:opacity-100 drop-shadow-sm" />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <Plus className="w-6 h-6" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Add Time Slot Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Add Class to Schedule
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 font-medium">Subject</Label>
              <Select value={newSlot.subjectId} onValueChange={(value) => setNewSlot({ ...newSlot, subjectId: value })}>
                <SelectTrigger className="mt-1 border-2 focus:border-blue-500 bg-white/70 backdrop-blur-sm">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }}></div>
                        {subject.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 font-medium">Start Time</Label>
                <Input
                  type="time"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                  className="mt-1 border-2 focus:border-blue-500 bg-white/70 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label className="text-gray-700 font-medium">End Time</Label>
                <Input
                  type="time"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                  className="mt-1 border-2 focus:border-blue-500 bg-white/70 backdrop-blur-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleAddSlot}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
              >
                Add to Schedule
              </Button>
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="border-2">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Students in Class Dialog */}
      <Dialog open={showStudentsDialog} onOpenChange={setShowStudentsDialog}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-white to-blue-50 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {selectedTimeSlot && getSubjectForSlot(selectedTimeSlot)?.name} - Students
            </DialogTitle>
          </DialogHeader>

          {selectedTimeSlot && (
            <div className="space-y-4">
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-blue-600">Class Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Subject:</span>
                      <span className="ml-2">{getSubjectForSlot(selectedTimeSlot)?.name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Room:</span>
                      <span className="ml-2">{getSubjectForSlot(selectedTimeSlot)?.room}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Time:</span>
                      <span className="ml-2">
                        {selectedTimeSlot.startTime} - {selectedTimeSlot.endTime}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Day:</span>
                      <span className="ml-2">{selectedTimeSlot.day}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-blue-600">
                    Students ({getStudentsForTimeSlot(selectedTimeSlot).length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {getStudentsForTimeSlot(selectedTimeSlot).length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No students enrolled in this class</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {getStudentsForTimeSlot(selectedTimeSlot).map((student) => {
                          const attendanceStatus = getAttendanceStatus(student.id)

                          return (
                            <div
                              key={student.id}
                              className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    student.isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
                                  }`}
                                ></div>
                                <div>
                                  <p className="font-medium">{student.name}</p>
                                  <p className="text-sm text-gray-600">{student.class}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {attendanceStatus && (
                                  <Badge
                                    variant={attendanceStatus === "present" ? "default" : "destructive"}
                                    className="mr-2"
                                  >
                                    {attendanceStatus}
                                  </Badge>
                                )}

                                {userRole === "teacher" && (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant={attendanceStatus === "present" ? "default" : "outline"}
                                      onClick={() => markAttendance(student.id, "present")}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={attendanceStatus === "absent" ? "destructive" : "outline"}
                                      onClick={() => markAttendance(student.id, "absent")}
                                      className="h-8 w-8 p-0"
                                    >
                                      <UserX className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
