import { doc, getDoc, setDoc, collection, addDoc, query, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "./firebase"
import type { Subject, TimeSlot, Assignment } from "@/app/page"

export interface ScheduleData {
  subjects: Subject[]
  timeSlots: TimeSlot[]
  assignments: Assignment[]
}

export interface SharedSchedule {
  id: string
  title: string
  subjects: Subject[]
  timeSlots: TimeSlot[]
  createdAt: Date
  expiresAt: Date
  views: number
}

// Use localStorage as primary storage with Firebase as backup/sync
const STORAGE_KEY = "class-schedule-data"
const DEVICE_ID_KEY = "class-schedule-device-id"

// Generate a unique device ID for anonymous users
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}

export const initializeFirebase = () => {
  console.log("Firebase backend initialized")
}

export const getScheduleData = async (): Promise<ScheduleData | null> => {
  try {
    // First try to get from Firebase
    if (db) {
      const deviceId = getDeviceId()
      const docRef = doc(db, "schedules", deviceId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const firebaseData = docSnap.data() as ScheduleData
        // Also save to localStorage for offline access
        localStorage.setItem(STORAGE_KEY, JSON.stringify(firebaseData))
        console.log("Data loaded from Firebase")
        return firebaseData
      }
    }

    // Fallback to localStorage
    const localData = localStorage.getItem(STORAGE_KEY)
    if (localData) {
      console.log("Data loaded from localStorage")
      return JSON.parse(localData)
    }

    return null
  } catch (error) {
    console.error("Error fetching schedule data:", error)
    // Fallback to localStorage on error
    const localData = localStorage.getItem(STORAGE_KEY)
    if (localData) {
      return JSON.parse(localData)
    }
    return null
  }
}

export const saveScheduleData = async (data: ScheduleData): Promise<void> => {
  try {
    // Always save to localStorage first (immediate)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))

    // Then try to sync to Firebase
    if (db) {
      const deviceId = getDeviceId()
      const docRef = doc(db, "schedules", deviceId)
      await setDoc(docRef, {
        ...data,
        lastUpdated: new Date(),
        deviceId: deviceId,
      })
      console.log("Data synced to Firebase")
    }
  } catch (error) {
    console.error("Error saving to Firebase, data saved locally:", error)
    // Data is still saved to localStorage, so app continues to work
  }
}

// Shared Schedule Functions
export const saveSharedSchedule = async (scheduleData: {
  title: string
  subjects: Subject[]
  timeSlots: TimeSlot[]
}): Promise<string> => {
  try {
    if (db) {
      const sharedRef = collection(db, "shared-schedules")
      const docRef = await addDoc(sharedRef, {
        ...scheduleData,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        views: 0,
      })
      console.log("Schedule shared to Firebase")
      return docRef.id
    } else {
      // Fallback to localStorage with generated ID
      const shareId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const sharedData = {
        ...scheduleData,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        views: 0,
      }
      localStorage.setItem(`shared-schedule-${shareId}`, JSON.stringify(sharedData))
      return shareId
    }
  } catch (error) {
    console.error("Error saving shared schedule:", error)
    throw error
  }
}

export const getSharedSchedule = async (shareId: string): Promise<SharedSchedule | null> => {
  try {
    if (db && !shareId.startsWith("local_")) {
      const docRef = doc(db, "shared-schedules", shareId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        // Check if not expired
        if (data.expiresAt.toDate() > new Date()) {
          // Increment view count
          await setDoc(docRef, { views: (data.views || 0) + 1 }, { merge: true })
          return {
            id: shareId,
            ...data,
            createdAt: data.createdAt.toDate(),
            expiresAt: data.expiresAt.toDate(),
          } as SharedSchedule
        }
      }
    } else {
      // Check localStorage for local shares
      const localData = localStorage.getItem(`shared-schedule-${shareId}`)
      if (localData) {
        const parsedData = JSON.parse(localData)
        if (new Date(parsedData.expiresAt) > new Date()) {
          return {
            id: shareId,
            ...parsedData,
            createdAt: new Date(parsedData.createdAt),
            expiresAt: new Date(parsedData.expiresAt),
          }
        }
      }
    }
    return null
  } catch (error) {
    console.error("Error fetching shared schedule:", error)
    return null
  }
}

// Get recent shared schedules (public gallery)
export const getRecentSharedSchedules = async (limitCount = 10): Promise<SharedSchedule[]> => {
  try {
    if (db) {
      const q = query(collection(db, "shared-schedules"), orderBy("createdAt", "desc"), limit(limitCount))
      const querySnapshot = await getDocs(q)
      const schedules: SharedSchedule[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        // Only include non-expired schedules
        if (data.expiresAt.toDate() > new Date()) {
          schedules.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            expiresAt: data.expiresAt.toDate(),
          } as SharedSchedule)
        }
      })

      return schedules
    }
    return []
  } catch (error) {
    console.error("Error fetching recent shared schedules:", error)
    return []
  }
}

// Analytics function to track app usage
export const trackAppUsage = async (action: string, details?: any): Promise<void> => {
  try {
    if (db) {
      const analyticsRef = collection(db, "analytics")
      await addDoc(analyticsRef, {
        action,
        details,
        deviceId: getDeviceId(),
        timestamp: new Date(),
      })
    }
  } catch (error) {
    // Silently fail analytics to not disrupt user experience
    console.debug("Analytics tracking failed:", error)
  }
}

// Backup and restore functions
export const createBackup = async (): Promise<string> => {
  try {
    const data = await getScheduleData()
    if (data) {
      const backup = {
        ...data,
        backupDate: new Date().toISOString(),
        version: "2.0",
      }
      return JSON.stringify(backup, null, 2)
    }
    throw new Error("No data to backup")
  } catch (error) {
    console.error("Error creating backup:", error)
    throw error
  }
}

export const restoreFromBackup = async (backupData: string): Promise<void> => {
  try {
    const data = JSON.parse(backupData)
    // Validate backup data structure
    if (data.subjects && data.timeSlots && data.assignments) {
      await saveScheduleData({
        subjects: data.subjects,
        timeSlots: data.timeSlots,
        assignments: data.assignments,
      })
      console.log("Data restored from backup")
    } else {
      throw new Error("Invalid backup data format")
    }
  } catch (error) {
    console.error("Error restoring from backup:", error)
    throw error
  }
}
