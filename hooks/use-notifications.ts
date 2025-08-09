"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

export interface NotificationPermission {
  granted: boolean
  denied: boolean
  default: boolean
}

export interface ScheduledNotification {
  id: string
  title: string
  message: string
  scheduledTime: Date
  type: "class_reminder" | "assignment_due" | "general"
  data?: any
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    default: true,
  })
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([])
  const { toast } = useToast()

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const currentPermission = Notification.permission
      setPermission({
        granted: currentPermission === "granted",
        denied: currentPermission === "denied",
        default: currentPermission === "default",
      })
    }
  }, [])

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support notifications",
        variant: "destructive",
      })
      return false
    }

    try {
      const result = await Notification.requestPermission()
      const newPermission = {
        granted: result === "granted",
        denied: result === "denied",
        default: result === "default",
      }
      setPermission(newPermission)

      if (result === "granted") {
        toast({
          title: "Notifications enabled!",
          description: "You'll receive reminders for your classes and assignments",
        })
        return true
      } else {
        toast({
          title: "Notifications disabled",
          description: "You can enable them later in your browser settings",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      return false
    }
  }, [toast])

  // Send immediate notification
  const sendNotification = useCallback(
    (title: string, message: string, options?: NotificationOptions) => {
      if (!permission.granted) {
        // Fallback to toast notification
        toast({
          title,
          description: message,
        })
        return
      }

      try {
        const notification = new Notification(title, {
          body: message,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "class-schedule",
          requireInteraction: true,
          ...options,
        })

        // Auto close after 10 seconds
        setTimeout(() => {
          notification.close()
        }, 10000)

        // Handle click
        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      } catch (error) {
        console.error("Error sending notification:", error)
        // Fallback to toast
        toast({
          title,
          description: message,
        })
      }
    },
    [permission.granted, toast],
  )

  // Schedule a notification
  const scheduleNotification = useCallback(
    (notification: Omit<ScheduledNotification, "id">) => {
      const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const newNotification = { ...notification, id }

      setScheduledNotifications((prev) => [...prev, newNotification])

      // Calculate delay until notification time
      const delay = notification.scheduledTime.getTime() - Date.now()

      if (delay > 0) {
        setTimeout(() => {
          sendNotification(notification.title, notification.message)
          // Remove from scheduled notifications
          setScheduledNotifications((prev) => prev.filter((n) => n.id !== id))
        }, delay)
      }

      return id
    },
    [sendNotification],
  )

  // Cancel a scheduled notification
  const cancelNotification = useCallback((id: string) => {
    setScheduledNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  // Clear all scheduled notifications
  const clearAllNotifications = useCallback(() => {
    setScheduledNotifications([])
  }, [])

  return {
    permission,
    requestPermission,
    sendNotification,
    scheduleNotification,
    cancelNotification,
    clearAllNotifications,
    scheduledNotifications,
  }
}
