"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Subject } from "@/app/page"

interface SubjectManagerProps {
  subjects: Subject[]
  onAddSubject: (subject: Omit<Subject, "id">) => void
  onUpdateSubject: (id: string, subject: Omit<Subject, "id">) => void
  onDeleteSubject: (id: string) => void
  onClose: () => void
}

const predefinedColors = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#6366F1",
]

export default function SubjectManager({
  subjects,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  onClose,
}: SubjectManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    color: predefinedColors[0],
    instructor: "",
    room: "",
  })

  const resetForm = () => {
    setFormData({
      name: "",
      color: predefinedColors[0],
      instructor: "",
      room: "",
    })
    setEditingSubject(null)
    setShowAddForm(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingSubject) {
      onUpdateSubject(editingSubject.id, formData)
    } else {
      onAddSubject(formData)
    }
    resetForm()
  }

  const handleEdit = (subject: Subject) => {
    setFormData({
      name: subject.name,
      color: subject.color,
      instructor: subject.instructor,
      room: subject.room,
    })
    setEditingSubject(subject)
    setShowAddForm(true)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="subject-manager-description">
        <div id="subject-manager-description" className="sr-only">
          Manage your subjects including adding, editing, and deleting courses
        </div>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Subject Management
            <Button onClick={() => setShowAddForm(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {subjects.map((subject) => (
            <Card key={subject.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: subject.color }}></div>
                  <CardTitle className="text-lg">{subject.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Instructor:</span> {subject.instructor}
                  </p>
                  <p>
                    <span className="font-medium">Room:</span> {subject.room}
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => handleEdit(subject)} size="sm" variant="outline" className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => onDeleteSubject(subject.id)}
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingSubject ? "Edit Subject" : "Add New Subject"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Subject Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Mathematics, Physics"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="instructor">Instructor</Label>
                  <Input
                    id="instructor"
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    placeholder="e.g., Dr. Smith"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="room">Room/Location</Label>
                  <Input
                    id="room"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="e.g., Room 101, Lab A"
                    required
                  />
                </div>

                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 mt-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? "border-gray-800" : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingSubject ? "Update Subject" : "Add Subject"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}
