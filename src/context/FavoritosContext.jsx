import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const FavoritosContext = createContext()

export function FavoritosProvider({ children }) {
  const { user, perfil } = useAuth()
  const [favoritos, setFavoritos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!user || !perfil) {
      setFavoritos([])
      setCargando(false)
      return
    }
    cargarFavoritos()
  }, [user, perfil])

  const cargarFavoritos = async () => {
    const { data } = await supabase
      .from('favoritos')
      .select('producto_id')
      .eq('cliente_id', perfil.id)
    if (data) setFavoritos(data.map(f => f.producto_id))
    setCargando(false)
  }

  const toggleFavorito = async (productoId) => {
    if (!perfil) return
    if (favoritos.includes(productoId)) {
      await supabase.from('favoritos').delete().eq('cliente_id', perfil.id).eq('producto_id', productoId)
      setFavoritos(prev => prev.filter(id => id !== productoId))
    } else {
      await supabase.from('favoritos').insert({ cliente_id: perfil.id, producto_id: productoId })
      setFavoritos(prev => [...prev, productoId])
    }
  }

  return (
    <FavoritosContext.Provider value={{ favoritos, toggleFavorito, cargando, cantidad: favoritos.length }}>
      {children}
    </FavoritosContext.Provider>
  )
}

export const useFavoritos = () => useContext(FavoritosContext)
