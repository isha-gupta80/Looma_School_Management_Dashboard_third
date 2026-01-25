"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    const success = await login(username, password)

    if (!success) {
      setError("Invalid username or password")
    }
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section — reduced height */}
      <div
        className="relative h-[38vh] lg:h-[34vh] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url('/hero-bg.jpg')` }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Looma Education</h1>
          <h2 className="text-lg md:text-2xl font-light mb-3">Education for All in Nepal</h2>
          <p className="text-base text-white/90 max-w-2xl mx-auto">
            Dashboard for managing and monitoring Looma devices across schools
          </p>
        </div>
      </div>

      {/* Login Section — larger card, better balance */}
      <div className="flex-1 bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <Card className="border shadow-xl">
            <CardContent className="p-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Login</h2>
                <p className="text-gray-600 mt-1">Sign in to manage schools</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    className="h-12"
                    autoComplete="username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="h-12"
                    autoComplete="current-password"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer — unchanged */}
      <footer className="bg-gray-900 text-white py-6 text-center">
        <p className="text-sm">Looma Education - Bringing quality education to Nepal</p>
        <p className="text-xs text-gray-400 mt-1">Tax ID: 84-3424916 | Menlo Park, CA, USA</p>
      </footer>
    </div>
  )
}
