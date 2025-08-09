"use client"

import { useState, useEffect } from "react"
import { Bell, Settings, Check, X, Clock, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useNotifications } from "@/hooks/use-notifications"
import { useClassReminders } from "@/hooks/use-class-reminders"
import type { Subject, TimeSlot } from "@/app/page"

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
  subjects: Subject[]
  timeSlots: TimeSlot[]
}

interface InAppNotification {
  id: string
  title: string
  message: string
  timestamp: Date
  type: "class_reminder" | "assignment_due" | "general"
  read: boolean
  data?: any
}

export default function NotificationCenter({ isOpen, onClose, subjects, timeSlots }: NotificationCenterProps) {
  const { permission, requestPermission, scheduledNotifications } = useNotifications()
  const { scheduleAllReminders, getNextClassTime } = useClassReminders({ subjects, timeSlots })

  const [inAppNotifications, setInAppNotifications] = useState<InAppNotification[]>([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [classRemindersEnabled, setClassRemindersEnabled] = useState(true)
  const [reminderMinutes, setReminderMinutes] = useState(10)

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("notification-settings")
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setNotificationsEnabled(settings.notificationsEnabled || false)
      setClassRemindersEnabled(settings.classRemindersEnabled !== false)
      setReminderMinutes(settings.reminderMinutes || 10)
    }
  }, [])

  // Save settings to localStorage
  useEffect(() => {
    const settings = {
      notificationsEnabled,
      classRemindersEnabled,
      reminderMinutes,
    }
    localStorage.setItem("notification-settings", JSON.stringify(settings))
  }, [notificationsEnabled, classRemindersEnabled, reminderMinutes])

  // Load in-app notifications from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("in-app-notifications")
    if (saved) {
      const notifications = JSON.parse(saved).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp),
      }))
      setInAppNotifications(notifications)
    }
  }, [])

  // Save in-app notifications to localStorage
  const saveNotifications = (notifications: InAppNotification[]) => {
    localStorage.setItem("in-app-notifications", JSON.stringify(notifications))
    setInAppNotifications(notifications)
  }

  // Add in-app notification
  const addInAppNotification = (notification: Omit<InAppNotification, "id" | "timestamp" | "read">) => {
    const newNotification: InAppNotification = {
      ...notification,
      id: `in_app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    }

    const updated = [newNotification, ...inAppNotifications].slice(0, 50) // Keep last 50
    saveNotifications(updated)
  }

  // Mark notification as read
  const markAsRead = (id: string) => {
    const updated = inAppNotifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    saveNotifications(updated)
  }

  // Mark all as read
  const markAllAsRead = () => {
    const updated = inAppNotifications.map((n) => ({ ...n, read: true }))
    saveNotifications(updated)
  }

  // Delete notification
  const deleteNotification = (id: string) => {
    const updated = inAppNotifications.filter((n) => n.id !== id)
    saveNotifications(updated)
  }

  // Clear all notifications
  const clearAllNotifications = () => {
    saveNotifications([])
  }

  // Handle enable notifications
  const handleEnableNotifications = async () => {
    if (!permission.granted) {
      const granted = await requestPermission()
      setNotificationsEnabled(granted)
      if (granted && classRemindersEnabled) {
        scheduleAllReminders()
      }
    } else {
      setNotificationsEnabled(!notificationsEnabled)
    }
  }

  // Get upcoming classes for today
  const getTodaysClasses = () => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" })
    return timeSlots
      .filter((ts) => ts.day === today)
      .map((ts) => {
        const subject = subjects.find((s) => s.id === ts.subjectId)
        const nextTime = getNextClassTime(ts)
        return { timeSlot: ts, subject, nextTime }
      })
      .filter((item) => item.subject && item.nextTime)
      .sort((a, b) => a.nextTime!.getTime() - b.nextTime!.getTime())
  }

  const unreadCount = inAppNotifications.filter((n) => !n.read).length
  const todaysClasses = getTodaysClasses()

  // Simulate adding a test notification
  const addTestNotification = () => {
    addInAppNotification({
      title: "Test Notification",
      message: "This is a test notification to demonstrate the system",
      type: "general",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]" aria-describedby="notification-center-description">
        <div id="notification-center-description" className="sr-only">
          Notification center for managing class reminders and app notifications
        </div>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Center
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Browser Notifications</Label>
                  <p className="text-sm text-gray-500">
                    {permission.granted
                      ? "Receive notifications even when the app is closed"
                      : "Enable to receive notifications outside the app"}
                  </p>
                </div>
                <Switch
                  checked={notificationsEnabled && permission.granted}
                  onCheckedChange={handleEnableNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Class Reminders</Label>
                  <p className="text-sm text-gray-500">Get reminded before your classes start</p>
                </div>
                <Switch
                  checked={classRemindersEnabled}
                  onCheckedChange={(checked) => {
                    setClassRemindersEnabled(checked)
                    if (checked && permission.granted) {
                      scheduleAllReminders()
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Reminder Time</Label>
                <select
                  value={reminderMinutes}
                  onChange={(e) => setReminderMinutes(Number(e.target.value))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value={5}>5 minutes before</option>
                  <option value={10}>10 minutes before</option>
                  <option value={15}>15 minutes before</option>
                  <option value={30}>30 minutes before</option>
                </select>
              </div>

              <Button onClick={addTestNotification} variant="outline" size="sm">
                Send Test Notification
              </Button>
            </CardContent>
          </Card>

          {/* Today's Classes */}
          {todaysClasses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Today's Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todaysClasses.map(({ timeSlot, subject, nextTime }) => (
                    <div key={timeSlot.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject!.color }}></div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{subject!.name}</h4>
                        <p className="text-sm text-gray-600">
                          {timeSlot.startTime} - {timeSlot.endTime} • {subject!.room}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {nextTime!.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {nextTime!.getDate() === new Date().getDate() ? "Today" : "Tomorrow"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scheduled Notifications */}
          {scheduledNotifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Scheduled Reminders ({scheduledNotifications.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {scheduledNotifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="flex items-center gap-3 p-2 border rounded">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-gray-500">{notification.scheduledTime.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Notifications</span>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <Button onClick={markAllAsRead} variant="outline" size="sm">
                      <Check className="w-4 h-4 mr-1" />
                      Mark All Read
                    </Button>
                  )}
                  <Button onClick={clearAllNotifications} variant="outline" size="sm">
                    <X className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {inAppNotifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inAppNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border rounded-lg ${notification.read ? "bg-gray-50" : "bg-blue-50 border-blue-200"}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`text-sm font-medium ${!notification.read ? "text-blue-900" : ""}`}>
                                {notification.title}
                              </h4>
                              {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <p className="text-xs text-gray-500">{notification.timestamp.toLocaleString()}</p>
                          </div>
                          <div className="flex gap-1">
                            {!notification.read && (
                              <Button onClick={() => markAsRead(notification.id)} variant="ghost" size="sm">
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            <Button onClick={() => deleteNotification(notification.id)} variant="ghost" size="sm">
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
