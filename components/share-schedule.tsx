"use client"

import { useState } from "react"
import { Share2, Copy, Download, Mail, MessageSquare, Users, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { saveSharedSchedule } from "@/lib/firebase-utils"
import type { Subject, TimeSlot } from "@/app/page"

interface ShareScheduleProps {
  subjects: Subject[]
  timeSlots: TimeSlot[]
  onClose: () => void
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function ShareSchedule({ subjects, timeSlots, onClose }: ShareScheduleProps) {
  const [shareMethod, setShareMethod] = useState<"link" | "text" | "email" | "public">("link")
  const [email, setEmail] = useState("")
  const [scheduleTitle, setScheduleTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [sharedLink, setSharedLink] = useState("")
  const { toast } = useToast()

  const generateScheduleText = () => {
    let scheduleText = "📅 My Class Schedule\n\n"

    days.forEach((day) => {
      const daySlots = timeSlots
        .filter((slot) => slot.day === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))

      if (daySlots.length > 0) {
        scheduleText += `${day}:\n`
        daySlots.forEach((slot) => {
          const subject = subjects.find((s) => s.id === slot.subjectId)
          if (subject) {
            scheduleText += `  • ${slot.startTime} - ${slot.endTime}: ${subject.name} (${subject.room})\n`
          }
        })
        scheduleText += "\n"
      }
    })

    return scheduleText
  }

  const handleSharePublicly = async () => {
    if (!scheduleTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your schedule.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const shareId = await saveSharedSchedule({
        title: scheduleTitle.trim(),
        subjects,
        timeSlots,
      })

      const shareUrl = `${window.location.origin}/shared/${shareId}`
      setSharedLink(shareUrl)

      toast({
        title: "Schedule shared!",
        description: "Your schedule is now publicly available.",
      })
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Failed to share your schedule publicly.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateShareableLink = () => {
    const scheduleData = {
      subjects: subjects.map((s) => ({ name: s.name, color: s.color, instructor: s.instructor, room: s.room })),
      timeSlots: timeSlots.map((ts) => ({
        subjectName: subjects.find((s) => s.id === ts.subjectId)?.name,
        day: ts.day,
        startTime: ts.startTime,
        endTime: ts.endTime,
      })),
    }

    const encodedData = btoa(JSON.stringify(scheduleData))
    return `${window.location.origin}/shared-schedule?data=${encodedData}`
  }

  const handleCopyLink = () => {
    const link = sharedLink || generateShareableLink()
    navigator.clipboard.writeText(link)
    toast({
      title: "Link copied!",
      description: "Schedule link has been copied to clipboard.",
    })
  }

  const handleCopyText = () => {
    const text = generateScheduleText()
    navigator.clipboard.writeText(text)
    toast({
      title: "Schedule copied!",
      description: "Schedule text has been copied to clipboard.",
    })
  }

  const handleEmailShare = () => {
    const subject = "My Class Schedule"
    const body = generateScheduleText()
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoLink)
  }

  const handleDownloadICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Class Schedule App//EN\n"

    timeSlots.forEach((slot, index) => {
      const subject = subjects.find((s) => s.id === slot.subjectId)
      if (subject) {
        const dayIndex = days.indexOf(slot.day)
        const startDate = new Date()
        startDate.setDate(startDate.getDate() + ((dayIndex - startDate.getDay() + 7) % 7))

        const [startHour, startMinute] = slot.startTime.split(":").map(Number)
        const [endHour, endMinute] = slot.endTime.split(":").map(Number)

        const startDateTime = new Date(startDate)
        startDateTime.setHours(startHour, startMinute, 0, 0)

        const endDateTime = new Date(startDate)
        endDateTime.setHours(endHour, endMinute, 0, 0)

        const formatDate = (date: Date) => {
          return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
        }

        icsContent += `BEGIN:VEVENT\n`
        icsContent += `UID:${index}@classschedule.app\n`
        icsContent += `DTSTART:${formatDate(startDateTime)}\n`
        icsContent += `DTEND:${formatDate(endDateTime)}\n`
        icsContent += `SUMMARY:${subject.name}\n`
        icsContent += `DESCRIPTION:Instructor: ${subject.instructor}\\nRoom: ${subject.room}\n`
        icsContent += `LOCATION:${subject.room}\n`
        icsContent += `RRULE:FREQ=WEEKLY\n`
        icsContent += `END:VEVENT\n`
      }
    })

    icsContent += "END:VCALENDAR"

    const blob = new Blob([icsContent], { type: "text/calendar" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "class-schedule.ics"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Calendar downloaded!",
      description: "Your schedule has been downloaded as a calendar file.",
    })
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" aria-describedby="share-schedule-description">
        <div id="share-schedule-description" className="sr-only">
          Share your class schedule via link, text, email, or calendar export
        </div>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Your Schedule
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card
              className={`cursor-pointer transition-all ${shareMethod === "public" ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => setShareMethod("public")}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Public Share
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">Share with community</p>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all ${shareMethod === "link" ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => setShareMethod("link")}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Private Link
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">Generate a private link</p>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all ${shareMethod === "text" ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => setShareMethod("text")}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Copy Text
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">Copy as formatted text</p>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all ${shareMethod === "email" ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => setShareMethod("email")}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">Send via email</p>
              </CardContent>
            </Card>
          </div>

          {shareMethod === "public" && (
            <Card>
              <CardHeader>
                <CardTitle>Share Publicly</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Share your schedule with the community. Others can discover and import your schedule.
                </p>
                <div>
                  <Label htmlFor="scheduleTitle">Schedule Title</Label>
                  <Input
                    id="scheduleTitle"
                    value={scheduleTitle}
                    onChange={(e) => setScheduleTitle(e.target.value)}
                    placeholder="e.g., Computer Science Fall 2024"
                    required
                  />
                </div>
                {sharedLink ? (
                  <div className="space-y-2">
                    <Label>Public Link</Label>
                    <div className="flex gap-2">
                      <Input value={sharedLink} readOnly />
                      <Button onClick={handleCopyLink}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={handleSharePublicly} disabled={loading} className="w-full">
                    <Users className="w-4 h-4 mr-2" />
                    {loading ? "Sharing..." : "Share Publicly"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {shareMethod === "link" && (
            <Card>
              <CardHeader>
                <CardTitle>Private Share Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Generate a private link that others can use to view your schedule.
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleCopyLink} className="flex-1">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Private Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {shareMethod === "text" && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule Text</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea value={generateScheduleText()} readOnly rows={10} className="font-mono text-sm" />
                <Button onClick={handleCopyText} className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Schedule Text
                </Button>
              </CardContent>
            </Card>
          )}

          {shareMethod === "email" && (
            <Card>
              <CardHeader>
                <CardTitle>Email Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Recipient Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <Button onClick={handleEmailShare} disabled={!email} className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleDownloadICS} variant="outline" className="w-full bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Download Calendar File (.ics)
              </Button>
              <p className="text-xs text-gray-600 mt-2">
                Import this file into Google Calendar, Outlook, or other calendar apps
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {days.map((day) => {
                  const daySlots = timeSlots
                    .filter((slot) => slot.day === day)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))

                  if (daySlots.length === 0) return null

                  return (
                    <div key={day}>
                      <h4 className="font-semibold text-sm mb-2">{day}</h4>
                      <div className="space-y-1 ml-4">
                        {daySlots.map((slot) => {
                          const subject = subjects.find((s) => s.id === slot.subjectId)
                          if (!subject) return null

                          return (
                            <div key={slot.id} className="flex items-center gap-2 text-sm">
                              <Badge style={{ backgroundColor: subject.color }} className="text-white text-xs">
                                {slot.startTime} - {slot.endTime}
                              </Badge>
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
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
