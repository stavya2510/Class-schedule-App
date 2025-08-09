"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { FileText, Upload, Download, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import type { Subject } from "@/app/page"

interface PDFDocument {
  id: string
  title: string
  description: string
  subjectId: string
  category: "notes" | "assignment" | "reference" | "syllabus"
  fileName: string
  fileSize: number
  uploadDate: string
  uploadedBy: string
}

interface PDFDocumentManagerProps {
  subjects: Subject[]
  userRole: "student" | "teacher"
  onClose: () => void
}

export default function PDFDocumentManager({ subjects, userRole, onClose }: PDFDocumentManagerProps) {
  const [documents, setDocuments] = useState<PDFDocument[]>([])
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [newDocument, setNewDocument] = useState({
    title: "",
    description: "",
    subjectId: "",
    category: "notes" as PDFDocument["category"],
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Load documents from localStorage
    const savedDocuments = JSON.parse(localStorage.getItem("pdf-documents") || "[]")
    setDocuments(savedDocuments)
  }, [])

  const saveDocuments = (updatedDocuments: PDFDocument[]) => {
    localStorage.setItem("pdf-documents", JSON.stringify(updatedDocuments))
    setDocuments(updatedDocuments)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF file",
          variant: "destructive",
        })
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        })
        return
      }

      setSelectedFile(file)
    }
  }

  const uploadDocument = () => {
    if (!newDocument.title || !newDocument.subjectId || !selectedFile) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select a file",
        variant: "destructive",
      })
      return
    }

    // In a real app, you would upload the file to a server
    // For this demo, we'll simulate it by storing file info
    const document: PDFDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...newDocument,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      uploadDate: new Date().toISOString(),
      uploadedBy: "Current Teacher", // In real app, get from auth
    }

    const updatedDocuments = [...documents, document]
    saveDocuments(updatedDocuments)

    setShowUploadDialog(false)
    setNewDocument({ title: "", description: "", subjectId: "", category: "notes" })
    setSelectedFile(null)

    toast({
      title: "Document uploaded!",
      description: `${document.title} has been uploaded successfully`,
    })
  }

  const deleteDocument = (documentId: string) => {
    const updatedDocuments = documents.filter((doc) => doc.id !== documentId)
    saveDocuments(updatedDocuments)

    toast({
      title: "Document deleted!",
      description: "Document has been removed",
    })
  }

  const downloadDocument = (document: PDFDocument) => {
    // In a real app, you would download from server
    toast({
      title: "Download started",
      description: `Downloading ${document.fileName}`,
    })
  }

  const getCategoryColor = (category: PDFDocument["category"]) => {
    switch (category) {
      case "notes":
        return "bg-blue-500"
      case "assignment":
        return "bg-orange-500"
      case "reference":
        return "bg-green-500"
      case "syllabus":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = selectedSubject === "all" || doc.subjectId === selectedSubject
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory
    return matchesSearch && matchesSubject && matchesCategory
  })

  const groupedDocuments = subjects.reduce(
    (acc, subject) => {
      acc[subject.id] = filteredDocuments.filter((doc) => doc.subjectId === subject.id)
      return acc
    },
    {} as Record<string, PDFDocument[]>,
  )

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] bg-gradient-to-br from-white to-green-50 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            <FileText className="w-6 h-6 text-green-600" />
            Study Materials & Documents
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="all" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              All Documents
            </TabsTrigger>
            <TabsTrigger value="subjects" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white">
              By Subject
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              By Category
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/70 backdrop-blur-sm border-2 focus:border-green-500"
              />
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-48 bg-white/70 backdrop-blur-sm border-2 focus:border-green-500">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 bg-white/70 backdrop-blur-sm border-2 focus:border-green-500">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="notes">Notes</SelectItem>
                <SelectItem value="assignment">Assignments</SelectItem>
                <SelectItem value="reference">References</SelectItem>
                <SelectItem value="syllabus">Syllabus</SelectItem>
              </SelectContent>
            </Select>
            {userRole === "teacher" && (
              <Button
                onClick={() => setShowUploadDialog(true)}
                className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 shadow-lg"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            )}
          </div>

          <TabsContent value="all" className="space-y-4">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-green-600">All Documents ({filteredDocuments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {filteredDocuments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No documents found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredDocuments.map((document) => {
                        const subject = subjects.find((s) => s.id === document.subjectId)

                        return (
                          <div
                            key={document.id}
                            className="p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-800 mb-1">{document.title}</h4>
                                <p className="text-sm text-gray-600 mb-2">{document.description}</p>
                                <div className="flex items-center gap-2 mb-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: subject?.color }}
                                  ></div>
                                  <span className="text-xs text-gray-500">{subject?.name}</span>
                                  <Badge className={`${getCategoryColor(document.category)} text-xs`}>
                                    {document.category}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span>{formatFileSize(document.fileSize)}</span>
                                  <span>{new Date(document.uploadDate).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadDocument(document)}
                                className="flex-1"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                              {userRole === "teacher" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteDocument(document.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
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

          <TabsContent value="subjects" className="space-y-4">
            <ScrollArea className="h-96">
              {subjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No subjects found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {subjects.map((subject) => {
                    const subjectDocs = groupedDocuments[subject.id] || []

                    if (subjectDocs.length === 0) return null

                    return (
                      <Card key={subject.id} className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: subject.color }}></div>
                            <span className="text-lg text-green-600">{subject.name}</span>
                            <Badge variant="secondary">{subjectDocs.length} documents</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {subjectDocs.map((document) => (
                              <div key={document.id} className="p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-800 text-sm">{document.title}</h5>
                                    <p className="text-xs text-gray-600 mb-1">{document.description}</p>
                                    <div className="flex items-center gap-2">
                                      <Badge className={`${getCategoryColor(document.category)} text-xs`}>
                                        {document.category}
                                      </Badge>
                                      <span className="text-xs text-gray-500">{formatFileSize(document.fileSize)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => downloadDocument(document)}
                                    className="flex-1 h-8 text-xs"
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    Download
                                  </Button>
                                  {userRole === "teacher" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => deleteDocument(document.id)}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
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

          <TabsContent value="categories" className="space-y-4">
            <ScrollArea className="h-96">
              {["notes", "assignment", "reference", "syllabus"].map((category) => {
                const categoryDocs = filteredDocuments.filter((doc) => doc.category === category)

                if (categoryDocs.length === 0) return null

                return (
                  <Card key={category} className="bg-white/70 backdrop-blur-sm border-0 shadow-lg mb-4">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full ${getCategoryColor(category as PDFDocument["category"])}`}
                        ></div>
                        <span className="text-lg text-green-600 capitalize">{category}</span>
                        <Badge variant="secondary">{categoryDocs.length} documents</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {categoryDocs.map((document) => {
                          const subject = subjects.find((s) => s.id === document.subjectId)

                          return (
                            <div key={document.id} className="p-3 bg-gray-50 rounded-lg border">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-800 text-sm">{document.title}</h5>
                                  <p className="text-xs text-gray-600 mb-1">{document.description}</p>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: subject?.color }}
                                    ></div>
                                    <span className="text-xs text-gray-500">{subject?.name}</span>
                                    <span className="text-xs text-gray-500">{formatFileSize(document.fileSize)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadDocument(document)}
                                  className="flex-1 h-8 text-xs"
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  Download
                                </Button>
                                {userRole === "teacher" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => deleteDocument(document.id)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Upload Document Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="bg-gradient-to-br from-white to-green-50 border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                Upload Document
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700 font-medium">Document Title</Label>
                <Input
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                  className="mt-1 border-2 focus:border-green-500 bg-white/70 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Description</Label>
                <Input
                  value={newDocument.description}
                  onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                  className="mt-1 border-2 focus:border-green-500 bg-white/70 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Subject</Label>
                <Select
                  value={newDocument.subjectId}
                  onValueChange={(value) => setNewDocument({ ...newDocument, subjectId: value })}
                >
                  <SelectTrigger className="mt-1 border-2 focus:border-green-500 bg-white/70 backdrop-blur-sm">
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
              <div>
                <Label className="text-gray-700 font-medium">Category</Label>
                <Select
                  value={newDocument.category}
                  onValueChange={(value: PDFDocument["category"]) =>
                    setNewDocument({ ...newDocument, category: value })
                  }
                >
                  <SelectTrigger className="mt-1 border-2 focus:border-green-500 bg-white/70 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notes">Notes</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="reference">Reference Material</SelectItem>
                    <SelectItem value="syllabus">Syllabus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 font-medium">PDF File</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="mt-1 border-2 focus:border-green-500 bg-white/70 backdrop-blur-sm"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={uploadDocument}
                  className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 shadow-lg"
                >
                  Upload Document
                </Button>
                <Button variant="outline" onClick={() => setShowUploadDialog(false)} className="border-2">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
