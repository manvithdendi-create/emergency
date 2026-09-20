import { createClient } from '../utils/supabase/client'

export const supabase = createClient()

export const getSupabaseClient = () => supabase