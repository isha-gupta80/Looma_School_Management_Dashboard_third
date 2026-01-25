"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"
import { authAPI } from "./api-client"

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await authAPI.me()
        setUser(data.user)
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    checkSession()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const data = await authAPI.login(username, password)
      setUser(data.user)
      return true
    } catch {
      return false
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch {
      // Ignore errors on logout
    }
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const data = await authAPI.me()
      setUser(data.user)
    } catch (error) {
      console.error("Failed to refresh user:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}