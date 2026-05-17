import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from '../lib/supabase'

interface AuthStore {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  loading: true,

  signInWithGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: (import.meta.env.VITE_REDIRECT_URL as string) ?? window.location.origin,
      },
    })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))

// Bootstrap auth state on module load — no-op if Supabase not configured
if (supabaseConfigured) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    useAuthStore.setState({ session, user: session?.user ?? null, loading: false })
  })
  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.setState({ session, user: session?.user ?? null, loading: false })
  })
} else {
  useAuthStore.setState({ loading: false })
}
