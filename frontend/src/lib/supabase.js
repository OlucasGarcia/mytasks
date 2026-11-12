import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase =
    supabaseUrl && supabaseAnonKey
        ? createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
            },
        })
        : null

export function getSupabaseClient() {
    if (!supabase) {
        throw new Error(
            'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para conectar ao Supabase.'
        )
    }

    return supabase
}
