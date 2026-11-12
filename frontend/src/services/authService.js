import { getSupabaseClient } from '../lib/supabase'

export const authService = {
    async register({ name, email, password }) {
        const { data, error } = await getSupabaseClient().auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name },
                emailRedirectTo: `${window.location.origin}/dashboard`,
            },
        })

        if (error) throw error

        return {
            user: data.user,
            session: data.session,
            needsEmailConfirmation: !data.session,
        }
    },

    async login({ email, password }) {
        const { data, error } = await getSupabaseClient().auth.signInWithPassword({
            email,
            password,
        })

        if (error) throw error

        return data
    },

    async resetPassword(email) {
        const { error } = await getSupabaseClient().auth.resetPasswordForEmail(
            email,
            {
                redirectTo: `${window.location.origin}/login?updatePassword=true`,
            }
        )

        if (error) throw error
    },

    async updatePassword(password) {
        const { data, error } = await getSupabaseClient().auth.updateUser({
            password,
        })

        if (error) throw error

        return data.user
    },

    async logout() {
        const { error } = await getSupabaseClient().auth.signOut()

        if (error) throw error
    },
}
