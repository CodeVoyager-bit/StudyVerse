'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import { supabase } from '@/utils/supabase'

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '' })
  const [loading, setLoading] = useState(true)
// console.log(loading)
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }
        await fetchTasks()
      } catch (error) {
        console.error('Error checking session:', error)
        // router.replace('/')
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, []) 

  const fetchTasks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: newTask.title,
          description: newTask.description,
          due_date: newTask.dueDate,
          user_id: session.user.id,
          completed: false
        })

      if (error) throw error
      setNewTask({ title: '', description: '', dueDate: '' })
      fetchTasks()
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const toggleTask = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId)

      if (error) throw error
      fetchTasks()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      fetchTasks()
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
          <div key={task.id} className={`${styles.taskCard} ${task.completed ? styles.completed : ''}`}>
            <div className={styles.taskContent}>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              {task.due_date && (
                <p className={styles.dueDate}>
                  Due: {new Date(task.due_date).toLocaleString()}
                </p>
              )}
            </div>
            <div className={styles.taskActions}>
              <button
                onClick={() => toggleTask(task.id)}
                className={`btn ${task.completed ? 'btn-secondary' : 'btn-primary'}`}
              >
                {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </button>
              <button
                onClick={() => deleteTask(task.id)}
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
