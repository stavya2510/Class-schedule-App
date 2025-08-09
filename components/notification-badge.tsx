"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface NotificationBadgeProps {
  onClick: () => void
}

export default function NotificationBadge({ onClick }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const updateUnreadCount = () => {
      const saved = localStorage.getItem("in-app-notifications")
      if (saved) {
        const notifications = JSON.parse(saved)
        const unread = notifications.filter((n: any) => !n.read).length
        setUnreadCount(unread)
      }
    }

    // Initial load
    updateUnreadCount()

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "in-app-notifications") {
        updateUnreadCount()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Poll for changes (in case of same-tab updates)
    const interval = setInterval(updateUnreadCount, 5000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  return (
    <Button onClick={onClick} variant="outline" className="relative flex items-center gap-2 bg-transparent">
      <Bell className="w-4 h-4" />
      Notifications
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </Button>
  )
}
