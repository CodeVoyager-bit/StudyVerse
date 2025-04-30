'use client'

import { useState, useRef } from 'react'
import styles from '../page.module.css'

const WORK_DURATION = 25 * 60 // 25 minutes in seconds
const BREAK_DURATION = 5 * 60 // 5 minutes in seconds

export default function PomodoroPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [isWork, setIsWork] = useState(true)
  const [secondsLeft, setSecondsLeft] = useState(WORK_DURATION)
  const [cycles, setCycles] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const startTimer = () => {
    if (isRunning) return
    setIsRunning(true)
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev === 1) {
          clearInterval(intervalRef.current!)
          setIsRunning(false)
          if (isWork) {
            setIsWork(false)
            setSecondsLeft(BREAK_DURATION)
            setCycles(c => c + 1)
          } else {
            setIsWork(true)
            setSecondsLeft(WORK_DURATION)
          }
          return prev
        }
        return prev - 1
      })
    }, 1000)
  }

  const pauseTimer = () => {
    setIsRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const resetTimer = () => {
    setIsRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsWork(true)
    setSecondsLeft(WORK_DURATION)
    setCycles(0)
  }

  return (
    <div className={styles.container}>
      <h1>Pomodoro Timer</h1>
      <div className={styles.timerBox}>
        <div className={styles.mode}>{isWork ? 'Work' : 'Break'}</div>
        <div className={styles.time}>{formatTime(secondsLeft)}</div>
      </div>
      <div className={styles.controls}>
        <button className="btn btn-primary" onClick={startTimer} disabled={isRunning}>Start</button>
        <button className="btn btn-secondary" onClick={pauseTimer} disabled={!isRunning}>Pause</button>
        <button className="btn" onClick={resetTimer}>Reset</button>
      </div>
      <div className={styles.cycles}>Cycles completed: {cycles}</div>
    </div>
  )
}
