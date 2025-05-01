// 'use client'
// import { useState, useEffect } from "react";
// import Header  from './Header/header.js'
// export default function App(){
//   const [count,setCount]=useState(0)
//   useEffect(()=>{console.log('hi')},[count])
//   return <>
//  <Header></Header>
//   </>
// }
'use client'
import { supabase } from '@/utils/supabase'
// import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'
import { useEffect, useState } from 'react'
export default function Home() {
  let [authenticated,changeauthenticated]=useState(false)
//  let  router = useRouter()
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
  }, )
  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <h1>Welcome to StudyVerse</h1>
        <p>Your all-in-one study companion for academic success</p>
       {(!authenticated) ?<div className={styles.ctaButtons}>
          <Link href="/register" className="btn btn-primary">Get Started</Link>
          <Link href="/login" className="btn btn-secondary">Login</Link>
        </div>:''}
      </section>

      <section className={styles.features}>
        <h2>Features</h2>
        <div className={styles.featureGrid}>
          <div className="card">
            <h3>Task Manager</h3>
            <p>Organize your study tasks, set deadlines, and track your progress.</p>
          </div>
          <div className="card">
            <h3>Notes Section</h3>
            <p>Create and organize your study notes with ease.</p>
          </div>
          <div className="card">
            <h3>Pomodoro Timer</h3>
            <p>Boost your focus with the 25/5 study technique.</p>
          </div>
          <div className="card">
            <h3>CGPA Calculator</h3>
            <p>Track your academic performance and set goals.</p>
          </div>
          <div className="card">
            <h3>Daily Quotes</h3>
            <p>Stay motivated with inspirational quotes every day.</p>
          </div>
          <div className="card">
            <h3>Cloud Sync</h3>
            <p>Access your study materials from anywhere, anytime.</p>
          </div>
        </div>
      </section>
    </div>
  )
} 