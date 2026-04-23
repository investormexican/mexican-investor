import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rvlhihpgadqtebspuhwy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bGhpaHBnYWRxdGVic3B1aHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTE0NzksImV4cCI6MjA5MjI4NzQ3OX0.m2b4RnT-zsSzDG9b1Bzn7lLTuW1KWzBfs1RG5Zn82k8'

export const supabase = createClient(supabaseUrl, supabaseKey)