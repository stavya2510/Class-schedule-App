"use client"

import { useState, useEffect } from "react"
import { BookOpen, Plus, Play, Clock, Award, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import type { Subject } from "@/app/page"

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface Test {
  id: string
  title: string
  description: string
  subjectId: string
  questions: Question[]
  timeLimit: number // in minutes
  createdBy: string
  createdAt: string
}

interface TestResult {
  id: string
  testId: string
  studentId: string
  studentName: string
  score: number
  totalQuestions: number
  timeSpent: number
  completedAt: string
  answers: number[]
}

interface PracticeTestProps {
  subjects: Subject[]
  userRole?: "student" | "teacher"
  currentUser?: any
  onClose: () => void
}

export default function PracticeTest({ subjects, userRole = "teacher", currentUser, onClose }: PracticeTestProps) {
  const [tests, setTests] = useState<Test[]>([])
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [testStarted, setTestStarted] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [newTest, setNewTest] = useState({
    title: "",
    description: "",
    subjectId: "",
    timeLimit: 30,
    questions: [] as Question[],
  })
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    // Load tests and results from localStorage
    const savedTests = JSON.parse(localStorage.getItem("practice-tests") || "[]")
    const savedResults = JSON.parse(localStorage.getItem("test-results") || "[]")
    setTests(savedTests)
    setTestResults(savedResults)
  }, [])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (testStarted && timeLeft > 0 && !testCompleted) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            submitTest()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [testStarted, timeLeft, testCompleted])

  const saveTests = (updatedTests: Test[]) => {
    localStorage.setItem("practice-tests", JSON.stringify(updatedTests))
    setTests(updatedTests)
  }

  const saveResults = (updatedResults: TestResult[]) => {
    localStorage.setItem("test-results", JSON.stringify(updatedResults))
    setTestResults(updatedResults)
  }

  const createTest = () => {
    if (!newTest.title || !newTest.subjectId || newTest.questions.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and add at least one question",
        variant: "destructive",
      })
      return
    }

    const test: Test = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...newTest,
      createdBy: currentUser?.name || "Teacher",
      createdAt: new Date().toISOString(),
    }

    const updatedTests = [...tests, test]
    saveTests(updatedTests)

    setShowCreateDialog(false)
    setNewTest({ title: "", description: "", subjectId: "", timeLimit: 30, questions: [] })

    toast({
      title: "Test created!",
      description: `${test.title} has been created successfully`,
    })
  }

  const addQuestion = () => {
    if (!newQuestion.question || newQuestion.options.some((opt) => !opt.trim())) {
      toast({
        title: "Invalid Question",
        description: "Please fill in the question and all options",
        variant: "destructive",
      })
      return
    }

    const question: Question = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...newQuestion,
    }

    setNewTest({
      ...newTest,
      questions: [...newTest.questions, question],
    })

    setNewQuestion({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
    })

    toast({
      title: "Question added!",
      description: "Question has been added to the test",
    })
  }

  const startTest = (test: Test) => {
    setSelectedTest(test)
    setCurrentQuestion(0)
    setAnswers(new Array(test.questions.length).fill(-1))
    setTimeLeft(test.timeLimit * 60) // Convert to seconds
    setTestStarted(true)
    setTestCompleted(false)
    setShowTestDialog(true)
  }

  const selectAnswer = (answerIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answerIndex
    setAnswers(newAnswers)
  }

  const nextQuestion = () => {
    if (selectedTest && currentQuestion < selectedTest.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const submitTest = () => {
    if (!selectedTest || !currentUser) return

    const score = answers.reduce((total, answer, index) => {
      return total + (answer === selectedTest.questions[index].correctAnswer ? 1 : 0)
    }, 0)

    const result: TestResult = {
      id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      testId: selectedTest.id,
      studentId: currentUser.id,
      studentName: currentUser.name,
      score,
      totalQuestions: selectedTest.questions.length,
      timeSpent: selectedTest.timeLimit * 60 - timeLeft,
      completedAt: new Date().toISOString(),
      answers,
    }

    const updatedResults = [...testResults, result]
    saveResults(updatedResults)

    setTestCompleted(true)
    setTestStarted(false)

    toast({
      title: "Test completed!",
      description: `You scored ${score}/${selectedTest.questions.length} (${Math.round((score / selectedTest.questions.length) * 100)}%)`,
    })
  }

  const deleteTest = (testId: string) => {
    const updatedTests = tests.filter((test) => test.id !== testId)
    saveTests(updatedTests)

    toast({
      title: "Test deleted!",
      description: "Test has been removed",
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getTestResults = (testId: string) => {
    return testResults.filter((result) => result.testId === testId)
  }

  const getStudentResults = () => {
    if (!currentUser) return []
    return testResults.filter((result) => result.studentId === currentUser.id)
  }

  const availableTests = userRole === "student" ? tests : tests
  const studentResults = getStudentResults()

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] bg-gradient-to-br from-white to-orange-50 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            <BookOpen className="w-6 h-6 text-orange-600" />
            {userRole === "teacher" ? "Practice Test Management" : "Practice Tests"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="tests" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="tests" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              {userRole === "teacher" ? "Manage Tests" : "Available Tests"}
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              Results
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="space-y-4">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-orange-600">
                    {userRole === "teacher" ? "Created Tests" : "Available Tests"} ({availableTests.length})
                  </CardTitle>
                  {userRole === "teacher" && (
                    <Button
                      onClick={() => setShowCreateDialog(true)}
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Test
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {availableTests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No tests available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableTests.map((test) => {
                        const subject = subjects.find((s) => s.id === test.subjectId)
                        const results = getTestResults(test.id)

                        return (
                          <div
                            key={test.id}
                            className="p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-800 mb-1">{test.title}</h4>
                                <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                                <div className="flex items-center gap-2 mb-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: subject?.color }}
                                  ></div>
                                  <span className="text-xs text-gray-500">{subject?.name}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {test.questions.length} questions
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {test.timeLimit} min
                                  </span>
                                  <span>{results.length} attempts</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {userRole === "student" ? (
                                <Button
                                  onClick={() => startTest(test)}
                                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                                >
                                  <Play className="w-4 h-4 mr-1" />
                                  Start Test
                                </Button>
                              ) : (
                                <div className="flex gap-2 w-full">
                                  <Button onClick={() => startTest(test)} variant="outline" className="flex-1">
                                    <Play className="w-4 h-4 mr-1" />
                                    Preview
                                  </Button>
                                  <Button
                                    onClick={() => deleteTest(test.id)}
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-red-600">
                  {userRole === "teacher" ? "All Test Results" : "Your Results"}(
                  {userRole === "teacher" ? testResults.length : studentResults.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {(userRole === "teacher" ? testResults : studentResults).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No test results yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(userRole === "teacher" ? testResults : studentResults).map((result) => {
                        const test = tests.find((t) => t.id === result.testId)
                        const subject = test ? subjects.find((s) => s.id === test.subjectId) : null
                        const percentage = Math.round((result.score / result.totalQuestions) * 100)

                        return (
                          <div
                            key={result.id}
                            className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: subject?.color || "#gray" }}
                              ></div>
                              <div>
                                <h5 className="font-medium text-gray-800">{test?.title || "Unknown Test"}</h5>
                                <p className="text-sm text-gray-600">
                                  {userRole === "teacher" ? result.studentName : subject?.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(result.completedAt).toLocaleDateString()} • Time:{" "}
                                  {formatTime(result.timeSpent)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div
                                className={`text-lg font-bold ${
                                  percentage >= 80
                                    ? "text-green-600"
                                    : percentage >= 60
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                }`}
                              >
                                {result.score}/{result.totalQuestions}
                              </div>
                              <p className="text-sm text-gray-500">{percentage}%</p>
                              <Badge
                                variant={percentage >= 80 ? "default" : percentage >= 60 ? "secondary" : "destructive"}
                                className="mt-1"
                              >
                                {percentage >= 80 ? "Excellent" : percentage >= 60 ? "Good" : "Needs Improvement"}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Total Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {userRole === "teacher" ? tests.length : availableTests.length}
                  </div>
                  <p className="text-xs text-gray-500">{userRole === "teacher" ? "created" : "available"}</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Test Attempts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {userRole === "teacher" ? testResults.length : studentResults.length}
                  </div>
                  <p className="text-xs text-gray-500">total attempts</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Average Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {(userRole === "teacher" ? testResults : studentResults).length > 0
                      ? Math.round(
                          (userRole === "teacher" ? testResults : studentResults).reduce(
                            (sum, result) => sum + (result.score / result.totalQuestions) * 100,
                            0,
                          ) / (userRole === "teacher" ? testResults : studentResults).length,
                        )
                      : 0}
                    %
                  </div>
                  <p className="text-xs text-gray-500">average performance</p>
                </CardContent>
              </Card>
            </div>

            {userRole === "teacher" && (
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-purple-600">Subject Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subjects.map((subject) => {
                      const subjectTests = tests.filter((test) => test.subjectId === subject.id)
                      const subjectResults = testResults.filter((result) =>
                        subjectTests.some((test) => test.id === result.testId),
                      )
                      const avgScore =
                        subjectResults.length > 0
                          ? Math.round(
                              subjectResults.reduce(
                                (sum, result) => sum + (result.score / result.totalQuestions) * 100,
                                0,
                              ) / subjectResults.length,
                            )
                          : 0

                      return (
                        <div key={subject.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }}></div>
                              <span className="font-medium">{subject.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold">{avgScore}%</span>
                              <p className="text-xs text-gray-500">{subjectResults.length} attempts</p>
                            </div>
                          </div>
                          <Progress value={avgScore} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Test Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-3xl bg-gradient-to-br from-white to-orange-50 border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Create New Test
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 font-medium">Test Title</Label>
                  <Input
                    value={newTest.title}
                    onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
                    className="mt-1 border-2 focus:border-orange-500 bg-white/70 backdrop-blur-sm"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium">Time Limit (minutes)</Label>
                  <Input
                    type="number"
                    value={newTest.timeLimit}
                    onChange={(e) => setNewTest({ ...newTest, timeLimit: Number.parseInt(e.target.value) || 30 })}
                    className="mt-1 border-2 focus:border-orange-500 bg-white/70 backdrop-blur-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Description</Label>
                <Textarea
                  value={newTest.description}
                  onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                  className="mt-1 border-2 focus:border-orange-500 bg-white/70 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Subject</Label>
                <Select
                  value={newTest.subjectId}
                  onValueChange={(value) => setNewTest({ ...newTest, subjectId: value })}
                >
                  <SelectTrigger className="mt-1 border-2 focus:border-orange-500 bg-white/70 backdrop-blur-sm">
                    <SelectValue placeholder="Select subject" />
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

              {/* Add Question Section */}
              <Card className="bg-white/50 backdrop-blur-sm border-2 border-orange-200">
                <CardHeader>
                  <CardTitle className="text-lg text-orange-600">Add Question</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-700 font-medium">Question</Label>
                    <Textarea
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                      className="mt-1 border-2 focus:border-orange-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {newQuestion.options.map((option, index) => (
                      <div key={index}>
                        <Label className="text-gray-700 font-medium">Option {index + 1}</Label>
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...newQuestion.options]
                            newOptions[index] = e.target.value
                            setNewQuestion({ ...newQuestion, options: newOptions })
                          }}
                          className="mt-1 border-2 focus:border-orange-500"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">Correct Answer</Label>
                    <Select
                      value={newQuestion.correctAnswer.toString()}
                      onValueChange={(value) =>
                        setNewQuestion({ ...newQuestion, correctAnswer: Number.parseInt(value) })
                      }
                    >
                      <SelectTrigger className="mt-1 border-2 focus:border-orange-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {newQuestion.options.map((option, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            Option {index + 1}: {option || "Empty"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">Explanation (Optional)</Label>
                    <Textarea
                      value={newQuestion.explanation}
                      onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                      className="mt-1 border-2 focus:border-orange-500"
                    />
                  </div>
                  <Button
                    onClick={addQuestion}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                  >
                    Add Question
                  </Button>
                </CardContent>
              </Card>

              {/* Questions List */}
              {newTest.questions.length > 0 && (
                <Card className="bg-white/50 backdrop-blur-sm border-2 border-orange-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-600">Questions ({newTest.questions.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-32">
                      <div className="space-y-2">
                        {newTest.questions.map((question, index) => (
                          <div key={question.id} className="p-2 bg-white rounded border text-sm">
                            <span className="font-medium">Q{index + 1}:</span> {question.question}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={createTest}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg"
                >
                  Create Test
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-2">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Test Taking Dialog */}
        <Dialog
          open={showTestDialog}
          onOpenChange={() => {
            if (!testStarted || testCompleted) {
              setShowTestDialog(false)
              setSelectedTest(null)
              setTestStarted(false)
              setTestCompleted(false)
            }
          }}
        >
          <DialogContent className="max-w-3xl bg-gradient-to-br from-white to-orange-50 border-0 shadow-2xl">
            {selectedTest && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between text-xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    <span>{selectedTest.title}</span>
                    {testStarted && !testCompleted && (
                      <Badge variant="destructive" className="text-lg px-3 py-1">
                        {formatTime(timeLeft)}
                      </Badge>
                    )}
                  </DialogTitle>
                </DialogHeader>

                {!testStarted && !testCompleted ? (
                  <div className="space-y-4 text-center">
                    <div className="p-6 bg-white/70 backdrop-blur-sm rounded-lg border-2 border-orange-200">
                      <h3 className="text-xl font-semibold mb-4">{selectedTest.title}</h3>
                      <p className="text-gray-600 mb-4">{selectedTest.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Questions:</span> {selectedTest.questions.length}
                        </div>
                        <div>
                          <span className="font-medium">Time Limit:</span> {selectedTest.timeLimit} minutes
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => setTestStarted(true)}
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg px-8 py-3 text-lg"
                    >
                      Start Test
                    </Button>
                  </div>
                ) : testCompleted ? (
                  <div className="space-y-4 text-center">
                    <div className="p-6 bg-white/70 backdrop-blur-sm rounded-lg border-2 border-green-200">
                      <Award className="w-16 h-16 mx-auto mb-4 text-green-600" />
                      <h3 className="text-2xl font-bold mb-2">Test Completed!</h3>
                      <div className="text-lg mb-4">
                        Score:{" "}
                        {answers.reduce(
                          (total, answer, index) =>
                            total + (answer === selectedTest.questions[index].correctAnswer ? 1 : 0),
                          0,
                        )}
                        /{selectedTest.questions.length}
                      </div>
                      <div className="text-sm text-gray-600">
                        Time spent: {formatTime(selectedTest.timeLimit * 60 - timeLeft)}
                      </div>
                    </div>

                    {/* Show answers review */}
                    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-lg text-green-600">Review Answers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-64">
                          <div className="space-y-4">
                            {selectedTest.questions.map((question, index) => {
                              const isCorrect = answers[index] === question.correctAnswer

                              return (
                                <div
                                  key={question.id}
                                  className={`p-3 rounded-lg border-2 ${
                                    isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                                  }`}
                                >
                                  <div className="flex items-start gap-2 mb-2">
                                    <Badge variant={isCorrect ? "default" : "destructive"} className="mt-1">
                                      Q{index + 1}
                                    </Badge>
                                    <p className="font-medium">{question.question}</p>
                                  </div>
                                  <div className="ml-12 space-y-1 text-sm">
                                    <p>
                                      <span className="font-medium">Your answer:</span>{" "}
                                      {answers[index] >= 0 ? question.options[answers[index]] : "Not answered"}
                                    </p>
                                    <p>
                                      <span className="font-medium">Correct answer:</span>{" "}
                                      {question.options[question.correctAnswer]}
                                    </p>
                                    {question.explanation && (
                                      <p className="text-gray-600">
                                        <span className="font-medium">Explanation:</span> {question.explanation}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="secondary">
                        Question {currentQuestion + 1} of {selectedTest.questions.length}
                      </Badge>
                      <Progress
                        value={((currentQuestion + 1) / selectedTest.questions.length) * 100}
                        className="w-32"
                      />
                    </div>

                    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">
                          {selectedTest.questions[currentQuestion].question}
                        </h3>
                        <div className="space-y-3">
                          {selectedTest.questions[currentQuestion].options.map((option, index) => (
                            <Button
                              key={index}
                              variant={answers[currentQuestion] === index ? "default" : "outline"}
                              className="w-full text-left justify-start p-4 h-auto"
                              onClick={() => selectAnswer(index)}
                            >
                              <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                              {option}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-between">
                      <Button
                        onClick={prevQuestion}
                        disabled={currentQuestion === 0}
                        variant="outline"
                        className="border-2 bg-transparent"
                      >
                        Previous
                      </Button>

                      <div className="flex gap-2">
                        {currentQuestion === selectedTest.questions.length - 1 ? (
                          <Button
                            onClick={submitTest}
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
                          >
                            Submit Test
                          </Button>
                        ) : (
                          <Button
                            onClick={nextQuestion}
                            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg"
                          >
                            Next
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
