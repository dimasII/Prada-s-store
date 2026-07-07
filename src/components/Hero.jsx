export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h2>NUEVA COLECCIÓN 2026</h2>
        <p>Descubre las últimas tendencias en moda y accesorios</p>
        <button className="btn-primary" onClick={() => {
          document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })
        }}>
          Ver Colección
        </button>
      </div>
    </section>
  )
}
