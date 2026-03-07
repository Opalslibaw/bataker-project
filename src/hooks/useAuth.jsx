import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const mountedRef = useRef(true)

  const fetchProfile = async (uid) => {
    if (!uid) return null
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    return data ?? null
  }

  useEffect(() => {
    mountedRef.current = true

    const init = async () => {
      // Get session directly first (works on mobile)
      const { data: { session } } = await supabase.auth.getSession()
      if (!mountedRef.current) return
      
      if (session?.user) {
        setUser(session.user)
        const profileData = await fetchProfile(session.user.id)
        if (mountedRef.current) setProfile(profileData)
      } else {
        setUser(null)
        setProfile(null)
      }
      if (mountedRef.current) setInitialLoading(false)
    }

    init()

    // Fallback jika init lambat di mobile
    const fallbackTimer = setTimeout(() => {
      if (mountedRef.current) setInitialLoading(false)
    }, 1500)

    // Also listen for auth changes (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        const profileData = await fetchProfile(sessionUser.id)
        if (mountedRef.current) setProfile(profileData)
      } else {
        setProfile(null)
      }
      // Ensure loading stops on any auth event
      if (mountedRef.current) setInitialLoading(false)
    })

    return () => {
      mountedRef.current = false
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
    if (mountedRef.current) setProfile(data)
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
