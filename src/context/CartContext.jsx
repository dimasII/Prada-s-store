import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [carrito, setCarrito] = useState(() => {
    const saved = localStorage.getItem('pradas-carrito')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('pradas-carrito', JSON.stringify(carrito))
  }, [carrito])

  const agregarAlCarrito = (producto, talla = '', cantidad = 1) => {
    if (!talla) return
    setCarrito(prev => {
      const key = `${producto.id}-${talla}`
      const existente = prev.find(item => item.key === key)
      if (existente) {
        return prev.map(item =>
          item.key === key
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        )
      }
      return [...prev, { ...producto, key, talla, cantidad }]
    })
  }

  const eliminarDelCarrito = (key) => {
    setCarrito(prev => prev.filter(item => item.key !== key))
  }

  const actualizarCantidad = (key, cantidad) => {
    if (cantidad <= 0) {
      eliminarDelCarrito(key)
      return
    }
    setCarrito(prev =>
      prev.map(item =>
        item.key === key ? { ...item, cantidad } : item
      )
    )
  }

  const vaciarCarrito = () => setCarrito([])

  const total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0)

  return (
    <CartContext.Provider value={{
      carrito,
      agregarAlCarrito,
      eliminarDelCarrito,
      actualizarCantidad,
      vaciarCarrito,
      total,
      cantidadTotal: carrito.reduce((sum, item) => sum + item.cantidad, 0)
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
