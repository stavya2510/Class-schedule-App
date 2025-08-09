"use client"

import { useState, useEffect } from "react"
import { Calendar, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

interface CalendarEvent {
  id: string
  title: string
  description: string
  date: string
  type: "holiday" | "exam" | "event" | "deadline" | "break"
  isNational?: boolean
}

interface AcademicCalendarProps {
  userRole: "student" | "teacher"
  onClose: () => void
}

const nationalHolidays: CalendarEvent[] = [
  {
    id: "nh1",
    title: "New Year's Day",
    description: "National Holiday",
    date: "2024-01-01",
    type: "holiday",
    isNational: true,
  },
  {
    id: "nh2",
    title: "Martin Luther King Jr. Day",
    description: "National Holiday",
    date: "2024-01-15",
    type: "holiday",
    isNational: true,
  },
  {
    id: "nh3",
    title: "Presidents' Day",
    description: "National Holiday",
    date: "2024-02-19",
    type: "holiday",
    isNational: true,
  },
  {
    id: "nh4",
    title: "Memorial Day",
    description: "National Holiday",
    date: "2024-05-27",
    type: "holiday",
    isNational: true,
  },
  {
    id: "nh5",
    title: "Independence Day",
    description: "National Holiday",
    date: "2024-07-04",
    type: "holiday",
    isNational: true,
  },
  {
    id: "nh6",
    title: "Labor Day",
    description: "National Holiday",
    date: "2024-09-02",
    type: "holiday",
    isNational: true,
  },
  {
    id: "nh7",
    title: "Columbus Day",
    description: "National Holiday",
    date: "2024-10-14",
    type: "holiday",
    isNational: true,
  },
  {
    id: "nh8",
    title: "Veterans Day",
    description: "National Holiday",
    date: "2024-11-11",
    type: "holiday",
    isNational: true,
  },
  {
    id: "nh9",
    title: "Thanksgiving Day",
    description: "National Holiday",
    date: "2024-11-28",
    type: "holiday",
    isNational: true,
  },
  {
    id: "nh10",
    title: "Christmas Day",
    description: "National Holiday",
    date: "2024-12-25",
    type: "holiday",
    isNational: true,
  },
]

export default function AcademicCalendar({ userRole, onClose }: AcademicCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    type: "event" as CalendarEvent["type"],
  })
  const { toast } = useToast()

  useEffect(() => {
    // Load custom events from localStorage and combine with national holidays
    const savedEvents = JSON.parse(localStorage.getItem("academic-events") || "[]")
    setEvents([...nationalHolidays, ...savedEvents])
  }, [])

  const saveEvents = (updatedEvents: CalendarEvent[]) => {
    // Only save custom events (not national holidays)
    const customEvents = updatedEvents.filter((event) => !event.isNational)
    localStorage.setItem("academic-events", JSON.stringify(customEvents))
    setEvents(updatedEvents)
  }

  const addEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const event: CalendarEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...newEvent,
    }

    const updatedEvents = [...events, event]
    saveEvents(updatedEvents)
    setShowAddDialog(false)
    setNewEvent({ title: "", description: "", date: "", type: "event" })

    toast({
      title: "Event added!",
      description: `${event.title} has been added to the calendar`,
    })
  }

  const updateEvent = () => {
    if (!editingEvent || !editingEvent.title || !editingEvent.date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const updatedEvents = events.map((event) => (event.id === editingEvent.id ? editingEvent : event))
    saveEvents(updatedEvents)
    setEditingEvent(null)

    toast({
      title: "Event updated!",
      description: `${editingEvent.title} has been updated`,
    })
  }

  const deleteEvent = (eventId: string) => {
    const event = events.find((e) => e.id === eventId)
    if (event?.isNational) {
      toast({
        title: "Cannot delete",
        description: "National holidays cannot be deleted",
        variant: "destructive",
      })
      return
    }

    const updatedEvents = events.filter((event) => event.id !== eventId)
    saveEvents(updatedEvents)

    toast({
      title: "Event deleted!",
      description: "Event has been removed from the calendar",
    })
  }

  const getEventTypeColor = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "holiday":
        return "bg-red-500"
      case "exam":
        return "bg-orange-500"
      case "event":
        return "bg-blue-500"
      case "deadline":
        return "bg-purple-500"
      case "break":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getEventsForMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()

    return events
      .filter((event) => {
        const eventDate = new Date(event.date)
        return eventDate.getFullYear() === year && eventDate.getMonth() === month
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const getUpcomingEvents = () => {
    const today = new Date()
    return events
      .filter((event) => new Date(event.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10)
  }

  const monthEvents = getEventsForMonth(currentDate)
  const upcomingEvents = getUpcomingEvents()

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] bg-gradient-to-br from-white to-purple-50 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            <Calendar className="w-6 h-6 text-purple-600" />
            Academic Calendar
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="monthly" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="monthly" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              Monthly View
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">
              Upcoming Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="space-y-4">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-purple-600">
                    {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")} className="border-2">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigateMonth("next")} className="border-2">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    {userRole === "teacher" && (
                      <Button
                        onClick={() => setShowAddDialog(true)}
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Event
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {monthEvents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No events this month</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {monthEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full ${getEventTypeColor(event.type)}`}></div>
                            <div>
                              <h4 className="font-semibold text-gray-800">{event.title}</h4>
                              <p className="text-sm text-gray-600">{event.description}</p>
                              <p className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                            {userRole === "teacher" && !event.isNational && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingEvent(event)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteEvent(event.id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-pink-600">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {upcomingEvents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No upcoming events</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingEvents.map((event) => {
                        const daysUntil = Math.ceil(
                          (new Date(event.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                        )

                        return (
                          <div
                            key={event.id}
                            className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full ${getEventTypeColor(event.type)}`}></div>
                              <div>
                                <h4 className="font-semibold text-gray-800">{event.title}</h4>
                                <p className="text-sm text-gray-600">{event.description}</p>
                                <p className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                              <p
                                className={`text-sm mt-1 ${daysUntil <= 7 ? "text-red-600 font-semibold" : "text-gray-500"}`}
                              >
                                {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
                              </p>
                            </div>
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

        {/* Add Event Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="bg-gradient-to-br from-white to-purple-50 border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Add New Event
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700 font-medium">Event Title</Label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="mt-1 border-2 focus:border-purple-500 bg-white/70 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Description</Label>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="mt-1 border-2 focus:border-purple-500 bg-white/70 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Date</Label>
                <Input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="mt-1 border-2 focus:border-purple-500 bg-white/70 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Event Type</Label>
                <Select
                  value={newEvent.type}
                  onValueChange={(value: CalendarEvent["type"]) => setNewEvent({ ...newEvent, type: value })}
                >
                  <SelectTrigger className="mt-1 border-2 focus:border-purple-500 bg-white/70 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="break">Break</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={addEvent}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg"
                >
                  Add Event
                </Button>
                <Button variant="outline" onClick={() => setShowAddDialog(false)} className="border-2">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Event Dialog */}
        <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
          <DialogContent className="bg-gradient-to-br from-white to-purple-50 border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Edit Event
              </DialogTitle>
            </DialogHeader>
            {editingEvent && (
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700 font-medium">Event Title</Label>
                  <Input
                    value={editingEvent.title}
                    onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                    className="mt-1 border-2 focus:border-purple-500 bg-white/70 backdrop-blur-sm"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium">Description</Label>
                  <Textarea
                    value={editingEvent.description}
                    onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                    className="mt-1 border-2 focus:border-purple-500 bg-white/70 backdrop-blur-sm"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium">Date</Label>
                  <Input
                    type="date"
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    className="mt-1 border-2 focus:border-purple-500 bg-white/70 backdrop-blur-sm"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium">Event Type</Label>
                  <Select
                    value={editingEvent.type}
                    onValueChange={(value: CalendarEvent["type"]) => setEditingEvent({ ...editingEvent, type: value })}
                  >
                    <SelectTrigger className="mt-1 border-2 focus:border-purple-500 bg-white/70 backdrop-blur-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="break">Break</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={updateEvent}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg"
                  >
                    Update Event
                  </Button>
                  <Button variant="outline" onClick={() => setEditingEvent(null)} className="border-2">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
