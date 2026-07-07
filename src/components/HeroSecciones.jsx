import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const FALLBACKS = {
  'zapatillas-hombre': 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80',
  'zapatillas-mujer': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80',
}

export default function HeroSecciones({ onSeccionClick }) {
  const [secciones, setSecciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    cargarSecciones()
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const cargarSecciones = async () => {
    const { data } = await supabase
      .from('secciones')
      .select('*')
      .eq('activo', true)
      .order('orden')
    if (data) setSecciones(data)
    setCargando(false)
  }

  if (cargando) return <div className="banners-skeleton" />
  if (secciones.length === 0) return null

  return (
    <section className="banners-genero" ref={ref}>
      <div className="banners-container">
        {secciones.map((sec, i) => {
          const img = sec.imagen_url || FALLBACKS[sec.slug] || FALLBACKS['zapatillas-hombre']
          return (
            <div
              key={sec.id}
              className={`banner-card ${visible ? `banner-enter banner-enter-${i}` : ''}`}
              onClick={() => onSeccionClick?.(sec.slug)}
            >
              <div className="banner-img-wrap">
                <img src={img} alt={sec.titulo} loading="lazy" />
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
