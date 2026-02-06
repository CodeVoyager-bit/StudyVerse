'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'
import { supabase } from '@/utils/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [username, setUsername] = useState('') // Note: username not typically used in login, but kept state if needed or remove
  const router = useRouter()
  const [authenticated, changeAuthenticated] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          return
        }
        changeAuthenticated(true)
      } catch (error) {
        console.error('Error checking session:', error)
        //
      }
    }
    checkUser()
  })
  if (authenticated) {
    router.push('/')
    return
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        await supabase.auth.setSession(data.session)
        router.push('/')
      }
    } catch (error) {
      setError(`An error occurred during login ${error}`)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Login</h1>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" >
            Login
          </button>
        </form>
        <p className={styles.registerLink}>
          {"Don't have an account?"} <Link href="/register">Register here</Link>
        </p>
      </div>
    </div>
  )
}