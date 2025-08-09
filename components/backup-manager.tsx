"use client"

import type React from "react"

import { useState } from "react"
import { Download, Upload, Save, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { createBackup, restoreFromBackup } from "@/lib/firebase-utils"

interface BackupManagerProps {
  isOpen: boolean
  onClose: () => void
  onDataRestored: () => void
}

export default function BackupManager({ isOpen, onClose, onDataRestored }: BackupManagerProps) {
  const [backupData, setBackupData] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"export" | "import">("export")
  const { toast } = useToast()

  const handleCreateBackup = async () => {
    setLoading(true)
    try {
      const backup = await createBackup()
      setBackupData(backup)
      toast({
        title: "Backup created!",
        description: "Your schedule data has been exported successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Backup failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadBackup = () => {
    if (!backupData) return

    const blob = new Blob([backupData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `class-schedule-backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Backup downloaded!",
      description: "Your backup file has been saved to your device.",
    })
  }

  const handleRestoreBackup = async () => {
    if (!backupData.trim()) {
      toast({
        title: "No data to restore",
        description: "Please paste your backup data first.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await restoreFromBackup(backupData)
      onDataRestored()
      toast({
        title: "Data restored!",
        description: "Your schedule has been restored from the backup.",
      })
      onClose()
    } catch (error: any) {
      toast({
        title: "Restore failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setBackupData(content)
      }
      reader.readAsText(file)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" aria-describedby="backup-manager-description">
        <div id="backup-manager-description" className="sr-only">
          Export your schedule data as a backup or import data from a previous backup
        </div>
        <DialogHeader>
          <DialogTitle>Backup & Restore</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex gap-2">
            <Button
              variant={mode === "export" ? "default" : "outline"}
              onClick={() => setMode("export")}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button
              variant={mode === "import" ? "default" : "outline"}
              onClick={() => setMode("import")}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Data
            </Button>
          </div>

          {mode === "export" && (
            <Card>
              <CardHeader>
                <CardTitle>Export Your Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Create a backup of all your subjects, timetable, and assignments. This data can be imported later or
                    used on another device.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button onClick={handleCreateBackup} disabled={loading} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Creating..." : "Create Backup"}
                  </Button>
                  {backupData && (
                    <Button onClick={handleDownloadBackup} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>

                {backupData && (
                  <div className="space-y-2">
                    <Label>Backup Data (JSON)</Label>
                    <Textarea
                      value={backupData}
                      readOnly
                      rows={10}
                      className="font-mono text-sm"
                      placeholder="Your backup data will appear here..."
                    />
                    <p className="text-xs text-gray-500">
                      You can copy this data or download it as a file. Keep it safe for future use.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {mode === "import" && (
            <Card>
              <CardHeader>
                <CardTitle>Import Schedule Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Import will replace all your current data. Make sure to create a backup first if you want to keep
                    your existing schedule.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Upload Backup File</Label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Or Paste Backup Data</Label>
                  <Textarea
                    value={backupData}
                    onChange={(e) => setBackupData(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                    placeholder="Paste your backup JSON data here..."
                  />
                </div>

                <Button onClick={handleRestoreBackup} disabled={loading || !backupData.trim()} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  {loading ? "Restoring..." : "Restore Data"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
