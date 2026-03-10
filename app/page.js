'use client'
import { supabase } from '@/utils/supabase'
import Link from 'next/link'
import styles from './page.module.css'
import { useEffect, useState } from 'react'

export default function Home() {
  let [authenticated, changeauthenticated] = useState(false)

  useEffect(() => {
    console.log('User not authenticated')
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log(session)
      if (!session) {
        console.log('User not authenticated')
      } else {
        console.log('User authenticated')
        changeauthenticated(true)
      }
    }
    checkSession()
  },)
  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <div className="animate-float">
          <h1>Welcome to <span>StudyVerse</span></h1>
        </div>
        <p>Your all-in-one study universe. Manage tasks, track grades, and focus better.</p>
        {(!authenticated) ? <div className={styles.ctaButtons}>
          <Link href="/register" className="btn btn-primary glow-hover">Get Started</Link>
          <Link href="/login" className="btn btn-secondary">Login</Link>
        </div> :
          <div className={styles.ctaButtons}>
            <Link href="/task" className="btn btn-primary glow-hover">Go to Task Manager</Link>
          </div>}
      </section>

      <section className={styles.features}>
        <h2>Explore the Universe</h2>
        <div className={styles.featureGrid}>
           <Link href="/task" >
          <div className="card">
            <h3>✨ Task Manager</h3>
            <p>Organize your study tasks, set deadlines, and track your progress with intuitive lists.</p>
          </div>
          </Link>
          <Link href="/note" >
          <div className="card" >
            <h3>📝 Notes Section</h3>
            <p>Create and organize your study notes with ease. Keep your thoughts structured.</p>
          </div>
          </Link>
          <Link href="/pomodoro" >
          <div className="card">
            <h3>⏱️ Pomodoro Timer</h3>
            <p>Boost your focus with the 25/5 study technique. Stay productive without burnout.</p>
          </div>
          </Link>
          <Link href="/gpa" >
          <div className="card">
            <h3>🎓 CGPA Calculator</h3>
            <p>Track your academic performance and set goals. Know exactly where you stand.</p>
          </div>
          </Link>
          <Link href="/quotes" >
          <div className="card">
            <h3>💡 Daily Quotes</h3>
            <p>Stay motivated with inspirational quotes every day. Feed your mind with positivity.</p>
          </div>
          </Link>
          <div className="card">
            <h3>☁️ Cloud Sync</h3>
            <p>Access your study materials from anywhere, anytime. Your data follows you.</p>
          </div>
        </div>
      </section>
    </div>
  )
} 