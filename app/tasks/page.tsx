'use client'

import { useState, useEffect } from 'react'
// import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

interface Task {
  _id: string
  title: string
  description: string
  dueDate: string
  completed: boolean
}

export default function TasksPage() {
  // const { data: session, status } = useSession()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '' })
  const [loading, setLoading] = useState(true)
let status='authenticated'
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchTasks()
    }
  }, [status])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      })

      if (response.ok) {
        setNewTask({ title: '', description: '', dueDate: '' })
        fetchTasks()
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const toggleTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
      })

      if (response.ok) {
        fetchTasks()
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchTasks()
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading...</div>
  }

  return (
    <div className={styles.container}>
      <h1>Task Manager</h1>
      
      <form onSubmit={handleSubmit} className={styles.taskForm}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="form-control"
            required
          />
        </div>
        <div className="form-group">
          <textarea
            placeholder="Task description"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            className="form-control"
          />
        </div>
        <div className="form-group">
          <input
            type="datetime-local"
            value={newTask.dueDate}
            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
            className="form-control"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Add Task
        </button>
      </form>

      <div className={styles.taskList}>
        {tasks.map((task) => (
          <div key={task._id} className={`${styles.taskCard} ${task.completed ? styles.completed : ''}`}>
            <div className={styles.taskContent}>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              {task.dueDate && (
                <p className={styles.dueDate}>
                  Due: {new Date(task.dueDate).toLocaleString()}
                </p>
              )}
            </div>
            <div className={styles.taskActions}>
              <button
                onClick={() => toggleTask(task._id)}
                className={`btn ${task.completed ? 'btn-secondary' : 'btn-primary'}`}
              >
                {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </button>
              <button
                onClick={() => deleteTask(task._id)}
                className="btn btn-secondary"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 