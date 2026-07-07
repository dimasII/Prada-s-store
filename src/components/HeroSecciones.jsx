import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function HeroSecciones({ onSeccionClick }) {
  const [secciones, setSecciones] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarSecciones()
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

  if (cargando || secciones.length === 0) return null

  return (
    <section className="hero-secciones">
      <div className="secciones-grid">
        {secciones.map(sec => (
          <div key={sec.id} className="seccion-card" onClick={() => onSeccionClick?.(sec.slug)}>
            <div className="seccion-img-wrap">
              <img
                src={sec.imagen_url || `https://placehold.co/600x400/1a1a2e/e94560?text=${encodeURIComponent(sec.titulo)}`}
                alt={sec.titulo}
              />
              <div className="seccion-overlay">
                <h3>{sec.titulo}</h3>
                {sec.subtitulo && <p>{sec.subtitulo}</p>}
                <span className="seccion-btn">Ver colección →</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
