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
import Link from 'next/link'
import styles from './page.module.css'

export default function Home() {
  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <h1>Welcome to StudyVerse</h1>
        <p>Your all-in-one study companion for academic success</p>
        <div className={styles.ctaButtons}>
          <Link href="/register" className="btn btn-primary">Get Started</Link>
          <Link href="/login" className="btn btn-secondary">Login</Link>
        </div>
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