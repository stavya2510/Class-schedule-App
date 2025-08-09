"use client"

import { useState, useEffect } from "react"
import { Calendar, Eye, Users, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { getRecentSharedSchedules, type SharedSchedule } from "@/lib/firebase-utils"
import type { Subject, TimeSlot } from "@/app/page"

interface SharedScheduleGalleryProps {
  isOpen: boolean
  onClose: () => void
  onImportSchedule: (subjects: Subject[], timeSlots: TimeSlot[]) => void
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function SharedScheduleGallery({ isOpen, onClose, onImportSchedule }: SharedScheduleGalleryProps) {
  const [sharedSchedules, setSharedSchedules] = useState<SharedSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<SharedSchedule | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadSharedSchedules()
    }
  }, [isOpen])

  const loadSharedSchedules = async () => {
    setLoading(true)
    try {
      const schedules = await getRecentSharedSchedules(20)
      setSharedSchedules(schedules)
    } catch (error) {
      console.error("Error loading shared schedules:", error)
      toast({
        title: "Error",
        description: "Failed to load shared schedules",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImportSchedule = async (schedule: SharedSchedule) => {
    try {
      onImportSchedule(schedule.subjects, schedule.timeSlots)
      toast({
        title: "Schedule imported!",
        description: `Successfully imported "${schedule.title}"`,
      })
      onClose()
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to import the schedule",
        variant: "destructive",
      })
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks}w ago`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]" aria-describedby="shared-gallery-description">
        <div id="shared-gallery-description" className="sr-only">
          Browse and import shared class schedules from other users
        </div>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Shared Schedule Gallery
          </DialogTitle>
        </DialogHeader>

        {selectedSchedule ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{selectedSchedule.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatTimeAgo(selectedSchedule.createdAt)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {selectedSchedule.views} views
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleImportSchedule(selectedSchedule)}>
                  <Download className="w-4 h-4 mr-2" />
                  Import Schedule
                </Button>
                <Button variant="outline" onClick={() => setSelectedSchedule(null)}>
                  Back
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Schedule Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Subjects ({selectedSchedule.subjects.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSchedule.subjects.map((subject) => (
                        <Badge key={subject.id} style={{ backgroundColor: subject.color }} className="text-white">
                          {subject.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Weekly Schedule</h4>
                    <div className="space-y-2">
                      {days.map((day) => {
                        const daySlots = selectedSchedule.timeSlots
                          .filter((slot) => slot.day === day)
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))

                        if (daySlots.length === 0) return null

                        return (
                          <div key={day} className="border rounded-lg p-3">
                            <h5 className="font-medium mb-2">{day}</h5>
                            <div className="space-y-1">
                              {daySlots.map((slot) => {
                                const subject = selectedSchedule.subjects.find((s) => s.id === slot.subjectId)
                                if (!subject) return null

                                return (
                                  <div key={slot.id} className="flex items-center gap-2 text-sm">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: subject.color }}
                                    ></div>
                                    <span className="font-medium">
                                      {slot.startTime} - {slot.endTime}
                                    </span>
                                    <span>{subject.name}</span>
                                    <span className="text-gray-500">({subject.room})</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">Discover and import schedules shared by other users</p>
              <Button variant="outline" onClick={loadSharedSchedules} disabled={loading}>
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </div>

            <ScrollArea className="h-[500px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sharedSchedules.map((schedule) => (
                  <Card key={schedule.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{schedule.title}</CardTitle>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatTimeAgo(schedule.createdAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {schedule.views}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">
                            {schedule.subjects.length} subjects • {schedule.timeSlots.length} classes
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {schedule.subjects.slice(0, 4).map((subject) => (
                              <Badge
                                key={subject.id}
                                variant="secondary"
                                className="text-xs"
                                style={{ backgroundColor: subject.color + "20", color: subject.color }}
                              >
                                {subject.name}
                              </Badge>
                            ))}
                            {schedule.subjects.length > 4 && (
                              <Badge variant="secondary" className="text-xs">
                                +{schedule.subjects.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1" onClick={() => setSelectedSchedule(schedule)}>
                            View Details
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleImportSchedule(schedule)}>
                            <Download className="w-3 h-3 mr-1" />
                            Import
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {!loading && sharedSchedules.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No shared schedules yet</h3>
                  <p className="text-gray-500">Be the first to share your schedule with the community!</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading shared schedules...</p>
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
