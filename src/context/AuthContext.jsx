import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [esAdmin, setEsAdmin] = useState(false)
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        Promise.all([
          verificarAdmin(session.user.id),
          cargarPerfil(session.user.id),
        ]).finally(() => setCargando(false))
      } else {
        setCargando(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setEsAdmin(false)
        setPerfil(null)
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
  }

  const cargarPerfil = async (userId) => {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    setPerfil(data)
  }

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const { data: { user: u } } = await supabase.auth.getUser()
    if (u) {
      await Promise.all([
        verificarAdmin(u.id),
        cargarPerfil(u.id),
      ])
    }
  }

  const registrar = async (email, password, datos) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user) {
      const { error: errPerfil } = await supabase.from('clientes').insert({
        user_id: data.user.id,
        email,
        nombre: datos.nombre,
        telefono: datos.telefono || '',
        direccion: datos.direccion || '',
        ciudad: datos.ciudad || '',
        codigo_postal: datos.codigo_postal || '',
      })
      if (errPerfil) throw errPerfil
      await cargarPerfil(data.user.id)
    }
  }

  const actualizarPerfil = async (datos) => {
    if (!user) return
    const { error } = await supabase.from('clientes')
      .update(datos)
      .eq('user_id', user.id)
    if (error) throw error
    await cargarPerfil(user.id)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setPerfil(null)
    setEsAdmin(false)
  }

  return (
    <AuthContext.Provider value={{
      user, esAdmin, perfil, cargando,
      login, registrar, logout, actualizarPerfil,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
