import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nnqtvgcukvaqgutdyxhi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ucXR2Z2N1a3ZhcWd1dGR5eGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMjAzNzQsImV4cCI6MjA2MTU5NjM3NH0.F82kOkChAoBP46ggT_0gki2nIzxW_32Yve5tMlA6cdY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)