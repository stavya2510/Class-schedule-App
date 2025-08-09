"use client"

import { useEffect } from "react"
import { useNotifications } from "@/hooks/use-notifications"
import { useClassReminders } from "@/hooks/use-class-reminders"
import type { Subject, TimeSlot, Assignment } from "@/app/page"

interface ReminderServiceProps {
  subjects: Subject[]
  timeSlots: TimeSlot[]
  assignments: Assignment[]
}

export default function ReminderService({ subjects, timeSlots, assignments }: ReminderServiceProps) {
  const { sendNotification, permission } = useNotifications()
  const {} = useClassReminders({ subjects, timeSlots })

  // Schedule assignment reminders
  useEffect(() => {
    if (!permission.granted) return

    const scheduleAssignmentReminders = () => {
      assignments
        .filter((a) => !a.completed)
        .forEach((assignment) => {
          const dueDate = new Date(assignment.dueDate)
          const now = new Date()

          // Remind 1 day before due date
          const oneDayBefore = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000)
          if (oneDayBefore > now) {
            const delay = oneDayBefore.getTime() - now.getTime()
            setTimeout(() => {
              const subject = subjects.find((s) => s.id === assignment.subjectId)
              sendNotification(
                `Assignment Due Tomorrow: ${assignment.title}`,
                `Your ${assignment.type} for ${subject?.name || "Unknown Subject"} is due tomorrow`,
              )
            }, delay)
          }

          // Remind 1 hour before due date
          const oneHourBefore = new Date(dueDate.getTime() - 60 * 60 * 1000)
          if (oneHourBefore > now) {
            const delay = oneHourBefore.getTime() - now.getTime()
            setTimeout(() => {
              const subject = subjects.find((s) => s.id === assignment.subjectId)
              sendNotification(
                `Assignment Due Soon: ${assignment.title}`,
                `Your ${assignment.type} for ${subject?.name || "Unknown Subject"} is due in 1 hour!`,
              )
            }, delay)
          }
        })
    }

    scheduleAssignmentReminders()
  }, [assignments, subjects, permission.granted, sendNotification])

  // This component doesn't render anything, it just manages reminders
  return null
}
