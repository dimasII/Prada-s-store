import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminDashboard({ onCerrar }) {
  const [productos, setProductos] = useState([])
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', stock: '', imagen_url: '', categoria_id: '' })
  const [subiendo, setSubiendo] = useState(false)

  useEffect(() => {
    cargarProductos()
  }, [])

  const cargarProductos = async () => {
    const { data } = await supabase.from('productos').select('*').order('id', { ascending: false })
    if (data) setProductos(data)
  }

  const handleEdit = (producto) => {
    setEditando(producto.id)
    setForm({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio,
      stock: producto.stock,
      imagen_url: producto.imagen_url || '',
      categoria_id: producto.categoria_id || '',
    })
  }

  const handleNuevo = () => {
    setEditando('nuevo')
    setForm({ nombre: '', descripcion: '', precio: '', stock: '0', imagen_url: '', categoria_id: '' })
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setSubiendo(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const filePath = `productos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('productos')
      .upload(filePath, file)

    if (uploadError) {
      alert('Error al subir imagen: ' + uploadError.message)
      setSubiendo(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('productos')
      .getPublicUrl(filePath)

    setForm(prev => ({ ...prev, imagen_url: publicUrl }))
    setSubiendo(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio: parseFloat(form.precio),
      stock: parseInt(form.stock),
      imagen_url: form.imagen_url || null,
      categoria_id: form.categoria_id ? parseInt(form.categoria_id) : null,
    }

    if (editando === 'nuevo') {
      const { error } = await supabase.from('productos').insert(payload)
      if (error) { alert('Error: ' + error.message); return }
    } else {
      const { error } = await supabase.from('productos').update(payload).eq('id', editando)
      if (error) { alert('Error: ' + error.message); return }
    }

    setEditando(null)
    cargarProductos()
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    const { error } = await supabase.from('productos').update({ activo: false }).eq('id', id)
    if (error) { alert('Error: ' + error.message); return }
    cargarProductos()
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content modal-admin" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Administrar Productos</h2>
          <button className="modal-cerrar" onClick={onCerrar}>✕</button>
        </div>

        <div className="admin-toolbar">
          <button className="btn-primary" onClick={handleNuevo}>+ Nuevo Producto</button>
        </div>

        {editando && (
          <form onSubmit={handleSave} className="admin-form">
            <h3>{editando === 'nuevo' ? 'Nuevo Producto' : 'Editar Producto'}</h3>
            <input placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
            <textarea placeholder="Descripción" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={2} />
            <div className="admin-form-grid">
              <input type="number" step="0.01" placeholder="Precio" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} required />
              <input type="number" placeholder="Stock" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required />
            </div>
            <div className="admin-upload">
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={subiendo} />
              {subiendo && <span>Subiendo imagen...</span>}
              {form.imagen_url && (
                <img src={form.imagen_url} alt="Preview" className="admin-preview" />
              )}
            </div>
            <div className="admin-form-actions">
              <button type="submit" className="btn-primary" disabled={subiendo}>
                {editando === 'nuevo' ? 'Crear Producto' : 'Guardar Cambios'}
              </button>
              <button type="button" className="btn-vaciar" onClick={() => setEditando(null)}>Cancelar</button>
            </div>
          </form>
        )}

        <div className="admin-lista">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>
                    {p.imagen_url && (
                      <img src={p.imagen_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                    )}
                  </td>
                  <td>{p.nombre}</td>
                  <td>${Number(p.precio).toFixed(2)}</td>
                  <td>{p.stock}</td>
                  <td>{p.activo ? '✅' : '❌'}</td>
                  <td>
                    <button className="btn-small" onClick={() => handleEdit(p)}>✏️</button>
                    <button className="btn-small" onClick={() => handleDelete(p.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
