import { useState, useRef, useEffect } from 'react'

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('')
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target) && !query) setAbierto(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [query])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch?.(query)
    setAbierto(false)
  }

  return (
    <div className="search-bar" ref={ref}>
      {abierto ? (
        <form onSubmit={handleSubmit} className="search-form">
          <input
            type="text"
            placeholder="Buscar zapatillas, marcas..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === 'Escape' && setAbierto(false)}
          />
          <button type="submit" className="search-submit">🔍</button>
        </form>
      ) : (
        <button className="btn-nav-link" onClick={() => setAbierto(true)} title="Buscar">
          🔍
        </button>
      )}
    </div>
  )
}
