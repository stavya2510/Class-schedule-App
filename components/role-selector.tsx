"use client"
import { useState } from "react"
import { GraduationCap, Users, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface RoleSelectorProps {
  onRoleSelect: (role: "student" | "teacher", userData: any) => void
}

export default function RoleSelector({ onRoleSelect }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher" | null>(null)
  const [studentName, setStudentName] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [teacherName, setTeacherName] = useState("")
  const [teacherPassword, setTeacherPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const { toast } = useToast()

  const handleStudentSubmit = () => {
    if (!studentName.trim() || !studentClass.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both name and class",
        variant: "destructive",
      })
      return
    }

    const userData = {
      name: studentName.trim(),
      class: studentClass.trim(),
      id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    onRoleSelect("student", userData)
  }

  const handleTeacherSubmit = () => {
    if (!teacherName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your name",
        variant: "destructive",
      })
      return
    }

    if (teacherPassword !== "tr@gec") {
      toast({
        title: "Wrong Password",
        description: "Password is incorrect. Please try again.",
        variant: "destructive",
      })
      return
    }

    const userData = {
      name: teacherName.trim(),
      id: `teacher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    onRoleSelect("teacher", userData)
  }

  // Updated classes to include both school and college levels
  const classes = [
    // School Classes
    "Class 1A",
    "Class 1B",
    "Class 1C",
    "Class 2A",
    "Class 2B",
    "Class 2C",
    "Class 3A",
    "Class 3B",
    "Class 3C",
    "Class 4A",
    "Class 4B",
    "Class 4C",
    "Class 5A",
    "Class 5B",
    "Class 5C",
    "Class 6A",
    "Class 6B",
    "Class 6C",
    "Class 7A",
    "Class 7B",
    "Class 7C",
    "Class 8A",
    "Class 8B",
    "Class 8C",
    "Class 9A",
    "Class 9B",
    "Class 9C",
    "Class 10A",
    "Class 10B",
    "Class 10C",
    "Class 11A",
    "Class 11B",
    "Class 11C",
    "Class 12A",
    "Class 12B",
    "Class 12C",
    // College Years
    "1st Year - Computer Science",
    "1st Year - Engineering",
    "1st Year - Business",
    "1st Year - Arts",
    "1st Year - Science",
    "1st Year - Medicine",
    "2nd Year - Computer Science",
    "2nd Year - Engineering",
    "2nd Year - Business",
    "2nd Year - Arts",
    "2nd Year - Science",
    "2nd Year - Medicine",
    "3rd Year - Computer Science",
    "3rd Year - Engineering",
    "3rd Year - Business",
    "3rd Year - Arts",
    "3rd Year - Science",
    "3rd Year - Medicine",
    "4th Year - Computer Science",
    "4th Year - Engineering",
    "4th Year - Business",
    "4th Year - Arts",
    "4th Year - Science",
    "4th Year - Medicine",
  ]

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-600 via-purple-600 to-pink-600 opacity-80"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 opacity-60"></div>
      </div>

      {/* Abstract Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-1/4 right-20 w-24 h-24 bg-yellow-300/20 rounded-full blur-lg animate-bounce"></div>
        <div className="absolute bottom-1/4 left-1/4 w-40 h-40 bg-pink-300/15 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-28 h-28 bg-blue-300/20 rounded-full blur-xl animate-bounce"></div>

        {/* Study Icons */}
        <div className="absolute top-1/3 left-1/3 opacity-10">
          <GraduationCap className="w-16 h-16 text-white animate-float" />
        </div>
        <div className="absolute bottom-1/3 right-1/3 opacity-10">
          <Users className="w-12 h-12 text-white animate-float" style={{ animationDelay: "1s" }} />
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-2xl">Class Schedule & Reminder App</h1>
            <p className="text-white/90 text-xl drop-shadow-lg">Choose your role to get started</p>
          </div>

          {!selectedRole ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <GraduationCap className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Student
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 mb-6 text-lg">
                    View your schedule, track assignments, take practice tests, and manage your academic life.
                  </p>
                  <ul className="text-sm text-gray-500 mb-6 space-y-2">
                    <li>• View class schedule and attendance</li>
                    <li>• Track assignments and deadlines</li>
                    <li>• Take practice tests</li>
                    <li>• Access study materials</li>
                    <li>• Get AI tutoring help</li>
                  </ul>
                  <Button
                    onClick={() => setSelectedRole("student")}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
                    size="lg"
                  >
                    Continue as Student
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-3xl bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                    Teacher
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 mb-6 text-lg">
                    Manage classes, create tests, track student attendance, and share educational resources.
                  </p>
                  <ul className="text-sm text-gray-500 mb-6 space-y-2">
                    <li>• Create and manage class schedules</li>
                    <li>• Track student attendance</li>
                    <li>• Create practice tests</li>
                    <li>• Share study materials and PDFs</li>
                    <li>• Manage academic calendar</li>
                  </ul>
                  <Button
                    onClick={() => setSelectedRole("teacher")}
                    className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 shadow-lg"
                    size="lg"
                  >
                    Continue as Teacher
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : selectedRole === "student" ? (
            <Card className="max-w-md mx-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Student Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="studentName" className="text-gray-700 font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="studentName"
                    type="text"
                    placeholder="Enter your full name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="mt-1 border-2 focus:border-blue-500 shadow-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="studentClass" className="text-gray-700 font-medium">
                    Class / Year
                  </Label>
                  <Select value={studentClass} onValueChange={setStudentClass}>
                    <SelectTrigger className="mt-1 border-2 focus:border-blue-500 shadow-sm">
                      <SelectValue placeholder="Select your class or year" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <div className="px-2 py-1 text-sm font-semibold text-gray-500 border-b">School Classes</div>
                      {classes
                        .filter((cls) => cls.startsWith("Class"))
                        .map((cls) => (
                          <SelectItem key={cls} value={cls}>
                            {cls}
                          </SelectItem>
                        ))}
                      <div className="px-2 py-1 text-sm font-semibold text-gray-500 border-b border-t mt-2">
                        College Years
                      </div>
                      {classes
                        .filter((cls) => cls.includes("Year"))
                        .map((cls) => (
                          <SelectItem key={cls} value={cls}>
                            {cls}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleStudentSubmit}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
                  >
                    Enter App
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedRole(null)} className="border-2 hover:bg-gray-50">
                    Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="max-w-md mx-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  Teacher Login
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="teacherName" className="text-gray-700 font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="teacherName"
                    type="text"
                    placeholder="Enter your full name"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="mt-1 border-2 focus:border-green-500 shadow-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="teacherPassword" className="text-gray-700 font-medium">
                    Password
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="teacherPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      className="border-2 focus:border-green-500 shadow-sm pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleTeacherSubmit}
                    className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 shadow-lg"
                  >
                    Login
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedRole(null)} className="border-2 hover:bg-gray-50">
                    Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-center mt-8">
            <p className="text-white/80 drop-shadow-lg">You can switch roles anytime from the settings menu</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
