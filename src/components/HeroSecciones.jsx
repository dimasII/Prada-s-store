import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const FALLBACKS = {
  'zapatillas-hombre': 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80',
  'zapatillas-mujer': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80',
}

const FALLBACK_DEFAULT = 'https://placehold.co/800x600/1a1a2e/ffffff?text=Colección'

export default function HeroSecciones({ onSeccionClick }) {
  const [secciones, setSecciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errores, setErrores] = useState({})

  useEffect(() => {
    cargarSecciones()
  }, [])

  const cargarSecciones = async () => {
    const { data, error } = await supabase
      .from('secciones')
      .select('*')
      .eq('activo', true)
      .order('orden')
    if (error) console.error('Error cargando secciones:', error)
    if (data) setSecciones(data)
    setCargando(false)
  }

  if (cargando) return <div className="banners-skeleton" />
  if (secciones.length === 0) return null

  return (
    <section className="banners-genero">
      <div className="banners-container">
        {secciones.map((sec, i) => {
          const img = errores[sec.id]
            ? FALLBACKS[sec.slug] || FALLBACK_DEFAULT
            : sec.imagen_url || FALLBACKS[sec.slug] || FALLBACK_DEFAULT
          return (
            <div
              key={sec.id}
              className={`banner-card banner-enter banner-enter-${i}`}
              onClick={() => onSeccionClick?.(sec.slug)}
            >
              <div className="banner-img-wrap">
                <img
                  src={img}
                  alt={sec.titulo}
                  loading="lazy"
                  onError={() => setErrores(prev => ({ ...prev, [sec.id]: true }))}
                />
                <div className="banner-overlay" />
                <div className="banner-content">
                  <span className="banner-tag">
                    {sec.slug?.includes('mujer') ? '👩 MUJER' : '👨 HOMBRE'}
                  </span>
                  <h3 className="banner-title">{sec.titulo}</h3>
                  {sec.subtitulo && (
                    <p className="banner-desc">{sec.subtitulo}</p>
                  )}
                  <span className="banner-cta">
                    Comprar
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
