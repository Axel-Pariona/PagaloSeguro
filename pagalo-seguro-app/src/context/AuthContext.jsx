import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error obteniendo profile:', error.message)
      setProfile(null)
      return
    }

    setProfile(data)
  }

  useEffect(() => {
    async function loadSession() {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error obteniendo sesión:', error.message)
      }

      const currentSession = data.session
      const currentUser = currentSession?.user ?? null

      setSession(currentSession)
      setUser(currentUser)

      if (currentUser) {
        await loadProfile(currentUser.id)
      } else {
        setProfile(null)
      }

      setLoading(false)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      const currentUser = currentSession?.user ?? null

      setSession(currentSession)
      setUser(currentUser)

      if (currentUser) {
        await loadProfile(currentUser.id)
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async ({ email, password }) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    })
  }

  const signUp = async ({ email, password }) => {
    return await supabase.auth.signUp({
      email,
      password,
    })
  }

  const signOut = async () => {
    setProfile(null)
    return await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthenticated: Boolean(user),
        isAdmin: profile?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }

  return context
}