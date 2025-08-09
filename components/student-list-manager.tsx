"use client"

import { useState, useEffect } from "react"
import { Users, UserCheck, UserX, Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Student {
  id: string
  name: string
  class: string
  loginTime: string
  isOnline: boolean
}

interface StudentListManagerProps {
  onClose: () => void
}

export default function StudentListManager({ onClose }: StudentListManagerProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState("all")

  useEffect(() => {
    // Load logged-in students from localStorage
    const loggedStudents = JSON.parse(localStorage.getItem("logged-students") || "[]")
    setStudents(loggedStudents)
  }, [])

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = selectedClass === "all" || student.class === selectedClass
    return matchesSearch && matchesClass
  })

  const onlineStudents = filteredStudents.filter((s) => s.isOnline)
  const offlineStudents = filteredStudents.filter((s) => !s.isOnline)
  const uniqueClasses = [...new Set(students.map((s) => s.class))].sort()

  const getStudentsByClass = (className: string) => {
    return students.filter((s) => s.class === className)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-gradient-to-br from-white to-blue-50 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <Users className="w-6 h-6 text-blue-600" />
            Student Management
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="online" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="online" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              Online ({onlineStudents.length})
            </TabsTrigger>
            <TabsTrigger value="offline" className="data-[state=active]:bg-gray-500 data-[state=active]:text-white">
              Offline ({offlineStudents.length})
            </TabsTrigger>
            <TabsTrigger value="classes" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              By Class
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/70 backdrop-blur-sm border-2 focus:border-blue-500"
              />
            </div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 rounded-md border-2 bg-white/70 backdrop-blur-sm focus:border-blue-500"
            >
              <option value="all">All Classes</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          <TabsContent value="online" className="space-y-4">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <UserCheck className="w-5 h-5" />
                  Online Students ({onlineStudents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {onlineStudents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No online students found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {onlineStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <div>
                              <p className="font-medium text-green-800">{student.name}</p>
                              <p className="text-sm text-green-600">{student.class}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="default" className="bg-green-500">
                              Online
                            </Badge>
                            <p className="text-xs text-green-600 mt-1">
                              Since {new Date(student.loginTime).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offline" className="space-y-4">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-600">
                  <UserX className="w-5 h-5" />
                  Offline Students ({offlineStudents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {offlineStudents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No offline students found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {offlineStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                            <div>
                              <p className="font-medium text-gray-800">{student.name}</p>
                              <p className="text-sm text-gray-600">{student.class}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary">Offline</Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              Last seen {new Date(student.loginTime).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="space-y-4">
            <ScrollArea className="h-96">
              {uniqueClasses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No students found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {uniqueClasses.map((className) => {
                    const classStudents = getStudentsByClass(className)
                    const onlineCount = classStudents.filter((s) => s.isOnline).length

                    return (
                      <Card key={className} className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between">
                            <span className="text-lg text-blue-600">{className}</span>
                            <div className="flex gap-2">
                              <Badge variant="default" className="bg-green-500">
                                {onlineCount} Online
                              </Badge>
                              <Badge variant="secondary">{classStudents.length - onlineCount} Offline</Badge>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {classStudents.map((student) => (
                              <div
                                key={student.id}
                                className={`flex items-center gap-2 p-2 rounded-md ${
                                  student.isOnline
                                    ? "bg-green-50 border border-green-200"
                                    : "bg-gray-50 border border-gray-200"
                                }`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    student.isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
                                  }`}
                                ></div>
                                <span
                                  className={`text-sm ${
                                    student.isOnline ? "text-green-800 font-medium" : "text-gray-600"
                                  }`}
                                >
                                  {student.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
