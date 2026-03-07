import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)

  const fetchProfile = async (uid) => {
    if (!uid) return null
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single()
    return data ?? null
  }

  useEffect(() => {
    let mounted = true

    // Listen to auth state changes first — this fires immediately if session exists
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        const profileData = await fetchProfile(sessionUser.id)
        if (mounted) setProfile(profileData)
      } else {
        setProfile(null)
      }
      if (mounted) setInitialLoading(false)
    })

    // Fallback: if onAuthStateChange doesn't fire within 3s, stop loading
    const fallbackTimer = setTimeout(() => {
      if (mounted) setInitialLoading(false)
    }, 3000)

    return () => {
      mounted = false
      clearTimeout(fallbackTimer)
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async ({ email, password }) => {
    setAuthLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { ok: false, message: error.message }
      return { ok: true }
    } finally {
      setAuthLoading(false)
    }
  }

  const signUp = async ({ username, email, password }) => {
    setAuthLoading(true)
    try {
      const { data: { user: newUser }, error } = await supabase.auth.signUp({ email, password })
      if (error || !newUser) return { ok: false, message: error?.message || 'Gagal mendaftar.' }
      const { error: profileError } = await supabase.from('profiles').insert({
        id: newUser.id,
        username,
        avatar_url: null,
        games_played: 0,
        games_won: 0,
        games_lost: 0,
      })
      if (profileError) return { ok: false, message: 'Akun dibuat tapi gagal menyimpan profil. Coba lagi.' }
      return { ok: true }
    } finally {
      setAuthLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (!user) return
    const data = await fetchProfile(user.id)
    setProfile(data)
  }

  const value = useMemo(
    () => ({ user, profile, initialLoading, authLoading, signIn, signUp, signOut, refreshProfile }),
    [user, profile, initialLoading, authLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
