"use client"

import { useEffect, useCallback } from "react"
import { useNotifications } from "./use-notifications"
import type { Subject, TimeSlot } from "@/app/page"

interface UseClassRemindersProps {
  subjects: Subject[]
  timeSlots: TimeSlot[]
  reminderMinutes?: number
}

export function useClassReminders({ subjects, timeSlots, reminderMinutes = 10 }: UseClassRemindersProps) {
  const { scheduleNotification, clearAllNotifications, permission } = useNotifications()

  // Get today's day name
  const getTodayName = () => {
    return new Date().toLocaleDateString("en-US", { weekday: "long" })
  }

  // Calculate next occurrence of a class
  const getNextClassTime = useCallback((timeSlot: TimeSlot): Date | null => {
    const today = new Date()
    const todayName = getTodayName()
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    const todayIndex = today.getDay()
    const classIndex = days.indexOf(timeSlot.day)

    if (classIndex === -1) return null

    // Calculate days until next occurrence
    let daysUntil = classIndex - todayIndex
    if (daysUntil < 0) {
      daysUntil += 7 // Next week
    } else if (daysUntil === 0) {
      // Today - check if class time has passed
      const [hours, minutes] = timeSlot.startTime.split(":").map(Number)
      const classTime = new Date(today)
      classTime.setHours(hours, minutes, 0, 0)

      if (classTime.getTime() <= today.getTime()) {
        daysUntil = 7 // Next week
      }
    }

    // Create the next class date
    const nextClass = new Date(today)
    nextClass.setDate(today.getDate() + daysUntil)

    const [hours, minutes] = timeSlot.startTime.split(":").map(Number)
    nextClass.setHours(hours, minutes, 0, 0)

    return nextClass
  }, [])

  // Schedule reminders for all classes
  const scheduleAllReminders = useCallback(() => {
    if (!permission.granted) return

    // Clear existing reminders
    clearAllNotifications()

    timeSlots.forEach((timeSlot) => {
      const subject = subjects.find((s) => s.id === timeSlot.subjectId)
      if (!subject) return

      const nextClassTime = getNextClassTime(timeSlot)
      if (!nextClassTime) return

      // Schedule reminder 10 minutes before class
      const reminderTime = new Date(nextClassTime.getTime() - reminderMinutes * 60 * 1000)

      // Only schedule if reminder time is in the future
      if (reminderTime.getTime() > Date.now()) {
        scheduleNotification({
          title: `Class Reminder: ${subject.name}`,
          message: `Your ${subject.name} class starts in ${reminderMinutes} minutes at ${subject.room}`,
          scheduledTime: reminderTime,
          type: "class_reminder",
          data: {
            subjectId: subject.id,
            timeSlotId: timeSlot.id,
            classTime: nextClassTime.toISOString(),
          },
        })
      }
    })
  }, [
    subjects,
    timeSlots,
    reminderMinutes,
    permission.granted,
    scheduleNotification,
    clearAllNotifications,
    getNextClassTime,
  ])

  // Schedule reminders when data changes
  useEffect(() => {
    if (permission.granted && subjects.length > 0 && timeSlots.length > 0) {
      scheduleAllReminders()
    }
  }, [subjects, timeSlots, permission.granted, scheduleAllReminders])

  // Re-schedule reminders daily
  useEffect(() => {
    const scheduleDaily = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(now.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      const msUntilMidnight = tomorrow.getTime() - now.getTime()

      setTimeout(() => {
        scheduleAllReminders()
        // Set up daily interval
        const dailyInterval = setInterval(scheduleAllReminders, 24 * 60 * 60 * 1000)

        return () => clearInterval(dailyInterval)
      }, msUntilMidnight)
    }

    scheduleDaily()
  }, [scheduleAllReminders])

  return {
    scheduleAllReminders,
    getNextClassTime,
  }
}
