import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [esAdmin, setEsAdmin] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        verificarAdmin(session.user.id)
      } else {
        setCargando(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setEsAdmin(false)
        setCargando(false)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const verificarAdmin = async (userId) => {
    const { data } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    setEsAdmin(!!data)
    setCargando(false)
  }

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, esAdmin, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
