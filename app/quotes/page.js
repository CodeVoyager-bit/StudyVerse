'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import styles from './page.module.css'

export default function QuotesPage() {
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRandomQuote = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get total count of quotes
      const { count } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'study')

      if (!count) {
        setError('No quotes available')
        return
      }

      // Get a random offset
      const randomOffset = Math.floor(Math.random() * count)

      // Fetch one random quote
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('category', 'study')
        .range(randomOffset, randomOffset)
        .single()

      if (error) throw error
      setQuote(data)
    } catch (error) {
      setError('Failed to fetch quote')
      console.error('Error:', error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRandomQuote()
  }, [])

  if (loading) return <div className={styles.loading}>Loading...</div>
  if (error) return <div className={styles.error}>{error}</div>
  if (!quote) return <div className={styles.error}>No quote found</div>

  return (
    <div className={styles.container}>
      <div className={styles.quoteCard}>
        <blockquote className={styles.quote}>
          <p>{quote.text}</p>
          <footer>— {quote.author}</footer>
        </blockquote>
        <button 
          onClick={fetchRandomQuote}
          className={styles.refreshButton}
        >
          New Quote
        </button>
      </div>
    </div>
  )
}