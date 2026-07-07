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

  const agregarAlCarrito = (producto, cantidad = 1) => {
    setCarrito(prev => {
      const existente = prev.find(item => item.id === producto.id)
      if (existente) {
        return prev.map(item =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        )
      }
      return [...prev, { ...producto, cantidad }]
    })
  }

  const eliminarDelCarrito = (id) => {
    setCarrito(prev => prev.filter(item => item.id !== id))
  }

  const actualizarCantidad = (id, cantidad) => {
    if (cantidad <= 0) {
      eliminarDelCarrito(id)
      return
    }
    setCarrito(prev =>
      prev.map(item =>
        item.id === id ? { ...item, cantidad } : item
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
