"use client"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import type { School } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Monitor, Mail, Phone, User, Terminal, Building, X, School as SchoolIcon } from "lucide-react"
import Image from "next/image"

interface SchoolDetailModalProps {
  school: School | null
  isOpen: boolean
  onClose: () => void
}

const schoolImages = [
  "/schools/school-1.jpg",
  "/schools/school-2.jpg",
  "/schools/school-3.jpg",
  "/schools/school-4.jpg",
  "/schools/school-5.jpg",
]

// Default fallback component when images fail to load
function DefaultSchoolImage({ schoolName }: { schoolName: string }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#1a2c5b] via-[#2d4278] to-[#1a2c5b] flex items-center justify-center">
      <div className="text-center">
        <SchoolIcon className="h-24 w-24 text-white/20 mx-auto" />
      </div>
    </div>
  )
}

function getSchoolImage(schoolId: string): string {
  const hash = schoolId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return schoolImages[hash % schoolImages.length]
}

// Helper function to safely format coordinates
function formatCoordinate(value: number | null | undefined, decimals: number = 4): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "N/A"
  }
  return value.toFixed(decimals)
}

export function SchoolDetailModal({ school, isOpen, onClose }: SchoolDetailModalProps) {
  const { user } = useAuth()
  const canAccessSSH = user?.role === "admin" || user?.role === "staff"

  const [terminalOpen, setTerminalOpen] = useState(false)
  const [terminalLines, setTerminalLines] = useState<string[]>([])
  const [currentCommand, setCurrentCommand] = useState("")
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [imageError, setImageError] = useState(false)

  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (terminalOpen && inputRef.current) inputRef.current.focus()
  }, [terminalOpen])

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight
  }, [terminalLines])

  useEffect(() => {
    // Reset image error state when school changes
    setImageError(false)
  }, [school?.id])

  const openTerminal = () => {
    if (!school) return
    setTerminalOpen(true)
    setTerminalLines([
      `Connecting to ${school.loomaId?.toLowerCase() ?? "unknown"}.looma.local...`,
      "Connection established.",
      `Welcome to Looma OS v${school.looma?.version ?? "2.1.0"}`,
      "",
    ])
  }

  const closeTerminal = () => {
    setTerminalOpen(false)
    setTerminalLines([])
    setCurrentCommand("")
    setCommandHistory([])
    setHistoryIndex(-1)
  }

  const simulateCommand = (cmd: string): string[] => {
    const command = cmd.trim().toLowerCase()
    if (!school) return ["Error: No device connected"]

    if (command === "help") {
      return [
        "Available commands:",
        "  help          - Show this help message",
        "  uptime        - Show device uptime",
        "  df            - Show disk usage",
        "  free          - Show memory usage",
        "  looma info    - Show Looma device info",
        "  looma update  - Check for updates",
        "  looma sync    - Sync content library",
        "  exit          - Close terminal session",
        "",
      ]
    }
    if (command === "uptime") {
      const hours = Math.floor(Math.random() * 720) + 24
      const days = Math.floor(hours / 24)
      return [`System uptime: ${days} days, ${hours % 24} hours`, ""]
    }
    if (command === "df" || command === "df -h") {
      return [
        "Filesystem      Size  Used Avail Use% Mounted on",
        "/dev/sda1        32G   18G   12G  60% /",
        "/dev/sdb1       256G  142G  102G  58% /content",
        "",
      ]
    }
    if (command === "free" || command === "free -h") {
      return [
        "              total        used        free      shared  buff/cache   available",
        "Mem:          3.8Gi       1.2Gi       1.1Gi        52Mi       1.5Gi       2.3Gi",
        "Swap:         2.0Gi          0B       2.0Gi",
        "",
      ]
    }
    if (command === "looma info") {
      return [
        "Looma Device Information",
        "------------------------",
        `  Device ID: ${school.loomaId ?? "Unknown"}`,
        `  Serial: ${school.looma?.serialNumber ?? "N/A"}`,
        `  Version: ${school.looma?.version ?? "2.1.0"}`,
        `  School: ${school.name}`,
        "",
      ]
    }
    if (command === "looma update") {
      return [
        "Checking for updates...",
        "Current version: " + (school.looma?.version ?? "2.1.0"),
        "Latest version: 2.1.0",
        "System is up to date.",
        "",
      ]
    }
    if (command === "looma sync") {
      return [
        "Syncing content library...",
        "Checking content manifest...",
        "All content is up to date.",
        "Sync complete.",
        "",
      ]
    }
    if (command === "exit" || command === "quit" || command === "logout") {
      setTimeout(closeTerminal, 500)
      return ["Connection closed.", ""]
    }
    if (command === "clear") {
      setTerminalLines([])
      return []
    }
    if (command === "whoami") {
      return [`looma@${school.loomaId?.toLowerCase() ?? "device"}`, ""]
    }
    if (command === "pwd") {
      return ["/home/looma", ""]
    }
    if (command === "ls") {
      return ["content/  logs/  scripts/  config.json", ""]
    }
    if (command === "date") {
      return [new Date().toString(), ""]
    }
    if (command === "") return []
    return [`bash: ${cmd}: command not found`, "Type 'help' for available commands.", ""]
  }

  const handleCommand = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentCommand.trim()) {
      const newLines = [...terminalLines, `looma@device:~$ ${currentCommand}`, ...simulateCommand(currentCommand)]
      setTerminalLines(newLines)
      setCommandHistory([...commandHistory, currentCommand])
      setCurrentCommand("")
      setHistoryIndex(-1)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex] || "")
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex] || "")
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setCurrentCommand("")
      }
    }
  }

  if (!school) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="relative h-40 w-full overflow-hidden">
          {!imageError ? (
            <Image 
              src={getSchoolImage(school.id)} 
              alt={school.name} 
              fill 
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <DefaultSchoolImage schoolName={school.name} />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
          <div className="absolute bottom-4 left-6 right-6 z-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <DialogTitle className="text-xl text-white font-semibold tracking-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,1)' }}>{school.name}</DialogTitle>
                <DialogDescription className="text-sm text-white mt-1.5 flex items-center gap-2 font-medium" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,1)' }}>
                  <MapPin className="h-4 w-4 drop-shadow-lg" />
                  {school.palika || "N/A"}, {school.district || "N/A"}, {school.province || "N/A"}
                </DialogDescription>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-4 flex-1 overflow-hidden flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>{school.name}</DialogTitle>
            <DialogDescription>School details for {school.name}</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="remote" disabled={!canAccessSSH}>
                Remote
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 mt-4 min-h-0 overflow-auto pr-2 space-y-4">
              <TabsContent value="info" className="mt-0 space-y-4 focus-visible:outline-none">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        School Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Province</span>
                        <span className="text-right break-words">{school.province || "N/A"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">District</span>
                        <span className="text-right break-words">{school.district || "N/A"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Palika</span>
                        <span className="text-right break-words">{school.palika || "N/A"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Coordinates</span>
                        <span className="font-mono text-xs text-right break-all">
                          {formatCoordinate(school.latitude)}, {formatCoordinate(school.longitude)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="break-words flex-1">{school.contact?.headmaster || "N/A"}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        {school.contact?.email ? (
                          <a href={`mailto:${school.contact.email}`} className="text-primary hover:underline break-all flex-1">
                            {school.contact.email}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        {school.contact?.phone ? (
                          <a href={`tel:${school.contact.phone}`} className="text-primary hover:underline break-all flex-1">
                            {school.contact.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Looma Device
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground shrink-0">Device ID</span>
                        <span className="font-mono text-right break-all">{school.loomaId || "N/A"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground shrink-0">Serial Number</span>
                        <span className="font-mono text-xs text-right break-all">{school.looma?.serialNumber || "N/A"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground shrink-0">Version</span>
                        <span className="font-mono text-right">{school.looma?.version || "N/A"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="remote" className="mt-0 focus-visible:outline-none">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      Remote Shell Access
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {terminalOpen ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground font-mono">
                            SSH: looma@{school.loomaId?.toLowerCase() ?? "device"}.looma.local
                          </span>
                          <Button variant="ghost" size="sm" onClick={closeTerminal} className="h-6 w-6 p-0">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div
                          ref={terminalRef}
                          className="bg-zinc-900 text-green-400 rounded-lg p-4 font-mono text-sm h-64 overflow-y-auto"
                          onClick={() => inputRef.current?.focus()}
                        >
                          {terminalLines.map((line, i) => (
                            <div key={i} className={line.startsWith("looma@device") ? "text-cyan-400" : "text-green-400"}>
                              {line || "\u00A0"}
                            </div>
                          ))}
                          <div className="flex items-center">
                            <span className="text-cyan-400">looma@device:~$&nbsp;</span>
                            <input
                              ref={inputRef}
                              type="text"
                              value={currentCommand}
                              onChange={(e) => setCurrentCommand(e.target.value)}
                              onKeyDown={handleCommand}
                              className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono"
                              autoFocus
                            />
                            <span className="animate-pulse">_</span>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Type <code className="bg-muted px-1 rounded">help</code> for available commands,{" "}
                          <code className="bg-muted px-1 rounded">exit</code> to close
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Open a secure SSH connection to remotely access and manage this Looma device.
                        </p>
                        <div className="bg-sidebar text-sidebar-foreground rounded-lg p-4 font-mono text-sm">
                          <p className="text-muted-foreground mb-2">
                            $ ssh looma@{school.loomaId?.toLowerCase() ?? "unknown"}.looma.local
                          </p>
                          <p className="text-green-400">Ready to connect to {school.loomaId ?? "Unknown Device"}</p>
                        </div>
                        <Button className="w-full gap-2" onClick={openTerminal}>
                          <Terminal className="h-4 w-4" />
                          Open Remote Shell
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}