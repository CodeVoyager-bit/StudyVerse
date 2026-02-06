'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/navigation'

export default function Navigation() {
  const [authenticated, setAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkSession()


    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setAuthenticated(true)
        setUsername(session.user.user_metadata.username)
      } else {
        setAuthenticated(false)
        setUsername('')
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setAuthenticated(true)
      setUsername(session.user.user_metadata.username)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setAuthenticated(false)
      setUsername('')
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error.message)
    }
  }

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-semibold text-white tracking-tight hover:opacity-80 transition-opacity">
            StudyVerse
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/task" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Tasks</Link>
            <Link href="/note" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Notes</Link>
            <Link href="/pomodoro" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Pomodoro</Link>
            <Link href="/gpa" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">CGPA</Link>
            <Link href="/quotes" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Quotes</Link>
          </div>

          <div className="flex items-center gap-4">
            {authenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-300">Hi, {username}</span>
                <button
                  onClick={handleSignOut}
                  className="btn btn-secondary text-sm px-4 py-2"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="btn btn-secondary text-sm px-5 py-2">Login</Link>
                <Link href="/register" className="btn btn-primary text-sm px-5 py-2">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}