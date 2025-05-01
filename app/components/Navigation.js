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
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setAuthenticated(true)
        setUsername(session.user.user_metadata.username)
      }
    }
    checkSession()
  }, [])

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setAuthenticated(false)
      setUsername('')
      router.push('/')
    }
  }

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-content">
          <Link href="/" className="logo">StudyVerse</Link>
          <div className="nav-links">
            <Link href="/tasks">Tasks</Link>
            <Link href="/notes">Notes</Link>
            <Link href="/pomodoro">Pomodoro</Link>
            <Link href="/gpa">CGPA Calculator</Link>
            <Link href="/quotes">Daily Quotes</Link>
          </div>
          <div className="auth-buttons">
            {authenticated ? (
              <div className="user-menu">
                <span>Welcome, {username}</span>
                <button onClick={handleSignOut} className="btn btn-secondary">
                  Sign Out
                </button>
              </div>
            ) : (
              <div>
                <Link href="/login" className="btn btn-secondary">Login</Link>
                <Link href="/register" className="btn btn-primary">Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}