"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Edit, Trash2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Subject, Assignment } from "@/app/page"

interface AssignmentManagerProps {
  subjects: Subject[]
  assignments: Assignment[]
  onAddAssignment: (assignment: Omit<Assignment, "id">) => void
  onUpdateAssignment: (id: string, assignment: Partial<Assignment>) => void
  onDeleteAssignment: (id: string) => void
  onClose: () => void
}

export default function AssignmentManager({
  subjects,
  assignments,
  onAddAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onClose,
}: AssignmentManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [formData, setFormData] = useState({
    subjectId: "",
    title: "",
    description: "",
    dueDate: "",
    type: "assignment" as "assignment" | "homework" | "exam",
  })

  const resetForm = () => {
    setFormData({
      subjectId: "",
      title: "",
      description: "",
      dueDate: "",
      type: "assignment",
    })
    setEditingAssignment(null)
    setShowAddForm(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingAssignment) {
      onUpdateAssignment(editingAssignment.id, formData)
    } else {
      onAddAssignment({ ...formData, completed: false })
    }
    resetForm()
  }

  const handleEdit = (assignment: Assignment) => {
    setFormData({
      subjectId: assignment.subjectId,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      type: assignment.type,
    })
    setEditingAssignment(assignment)
    setShowAddForm(true)
  }

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId)
    return subject?.name || "Unknown Subject"
  }

  const getSubjectColor = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId)
    return subject?.color || "#gray"
  }

  const sortedAssignments = [...assignments].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  )

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        className="max-w-6xl max-h-[80vh] overflow-y-auto"
        aria-describedby="assignment-manager-description"
      >
        <div id="assignment-manager-description" className="sr-only">
          Manage your assignments, homework, and exams including adding, editing, and tracking completion
        </div>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Assignment & Task Management
            <Button onClick={() => setShowAddForm(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Pending Tasks</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sortedAssignments
                .filter((a) => !a.completed)
                .map((assignment) => {
                  const daysUntilDue = Math.ceil(
                    (new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                  )

                  return (
                    <Card key={assignment.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              style={{ backgroundColor: getSubjectColor(assignment.subjectId) }}
                              className="text-white"
                            >
                              {getSubjectName(assignment.subjectId)}
                            </Badge>
                            <Badge variant={assignment.type === "exam" ? "destructive" : "secondary"}>
                              {assignment.type}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button onClick={() => handleEdit(assignment)} size="sm" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => onDeleteAssignment(assignment.id)} size="sm" variant="ghost">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <h4 className="font-semibold mb-1">{assignment.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {new Date(assignment.dueDate).toLocaleDateString()}
                          </div>
                          <div
                            className={`text-sm font-medium ${
                              daysUntilDue <= 1
                                ? "text-red-600"
                                : daysUntilDue <= 3
                                  ? "text-orange-600"
                                  : "text-gray-600"
                            }`}
                          >
                            {daysUntilDue === 0
                              ? "Due today"
                              : daysUntilDue < 0
                                ? "Overdue"
                                : `${daysUntilDue} days left`}
                          </div>
                        </div>
                        <Button
                          onClick={() => onUpdateAssignment(assignment.id, { completed: true })}
                          size="sm"
                          className="w-full mt-3"
                        >
                          Mark as Completed
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              {assignments.filter((a) => !a.completed).length === 0 && (
                <p className="text-center text-gray-500 py-8">No pending tasks</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Completed Tasks</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {assignments
                .filter((a) => a.completed)
                .slice(0, 10)
                .map((assignment) => (
                  <Card key={assignment.id} className="bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            style={{ backgroundColor: getSubjectColor(assignment.subjectId) }}
                            className="text-white"
                          >
                            {getSubjectName(assignment.subjectId)}
                          </Badge>
                          <Badge variant="secondary">{assignment.type}</Badge>
                        </div>
                        <Button onClick={() => onDeleteAssignment(assignment.id)} size="sm" variant="ghost">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <h4 className="font-semibold text-green-800 mb-1">{assignment.title}</h4>
                      <p className="text-sm text-green-600">✓ Completed</p>
                      <Button
                        onClick={() => onUpdateAssignment(assignment.id, { completed: false })}
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                      >
                        Mark as Pending
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              {assignments.filter((a) => a.completed).length === 0 && (
                <p className="text-center text-gray-500 py-8">No completed tasks yet</p>
              )}
            </div>
          </div>
        </div>

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingAssignment ? "Edit Task" : "Add New Task"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Select
                      value={formData.subjectId}
                      onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }}></div>
                              {subject.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "assignment" | "homework" | "exam") =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="homework">Homework</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Chapter 5 Homework, Midterm Exam"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Additional details about the task..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingAssignment ? "Update Task" : "Add Task"}
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
