import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminDashboard({ onCerrar }) {
  const [vista, setVista] = useState('productos')
  const [productos, setProductos] = useState([])
  const [marcas, setMarcas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [secciones, setSecciones] = useState([])
  const [editandoSeccion, setEditandoSeccion] = useState(null)
  const [seccionForm, setSeccionForm] = useState({ titulo: '', subtitulo: '', imagen_url: '', slug: '' })
  const [subiendoSec, setSubiendoSec] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    nombre: '', descripcion: '', precio: '',
    genero: 'unisex', marca_id: '', categoria_id: '',
  })
  const [imagenesForm, setImagenesForm] = useState([])
  const [tallasForm, setTallasForm] = useState([])
  const [subiendo, setSubiendo] = useState(false)
  const [nuevaMarca, setNuevaMarca] = useState('')

  useEffect(() => {
    cargarProductos()
    cargarMarcas()
    cargarCategorias()
  }, [])

  const cargarProductos = async () => {
    const { data } = await supabase.from('productos').select('*, marcas(nombre)').order('id', { ascending: false })
    if (data) setProductos(data)
  }

  const cargarMarcas = async () => {
    const { data } = await supabase.from('marcas').select('*').order('nombre')
    if (data) setMarcas(data)
  }

  const cargarCategorias = async () => {
    const { data } = await supabase.from('categorias').select('*').order('nombre')
    if (data) setCategorias(data)
  }

  const cargarTallas = async (productoId) => {
    const { data } = await supabase.from('producto_tallas').select('*').eq('producto_id', productoId).order('talla')
    if (data) setTallasForm(data)
  }

  const cargarImagenes = async (productoId) => {
    const { data } = await supabase.from('producto_imagenes').select('*').eq('producto_id', productoId).order('orden')
    if (data) setImagenesForm(data)
  }

  const handleEdit = async (producto) => {
    setEditando(producto.id)
    setForm({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio,
      genero: producto.genero || 'unisex',
      marca_id: producto.marca_id || '',
      categoria_id: producto.categoria_id || '',
    })
    await Promise.all([
      cargarTallas(producto.id),
      cargarImagenes(producto.id),
    ])
  }

  const handleNuevo = () => {
    setEditando('nuevo')
    setForm({ nombre: '', descripcion: '', precio: '', genero: 'unisex', marca_id: '', categoria_id: '' })
    setTallasForm([{ talla: '', stock: 0 }])
    setImagenesForm([])
  }

  const handleImageUpload = async (e) => {
    const files = e.target.files
    if (!files.length) return
    setSubiendo(true)
    const nuevasUrls = []
    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const filePath = `productos/${fileName}`
      const { error } = await supabase.storage.from('productos').upload(filePath, file)
      if (error) { alert('Error al subir ' + file.name + ': ' + error.message); continue }
      const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(filePath)
      nuevasUrls.push(publicUrl)
    }
    setImagenesForm(prev => [...prev, ...nuevasUrls.map((url, i) => ({ url, orden: prev.length + i, id: `temp-${Date.now()}-${i}` }))])
    setSubiendo(false)
  }

  const eliminarImagenForm = (index) => {
    setImagenesForm(prev => prev.filter((_, i) => i !== index))
  }

  const agregarTalla = () => {
    setTallasForm([...tallasForm, { talla: '', stock: 0 }])
  }

  const actualizarTalla = (index, campo, valor) => {
    const nuevas = [...tallasForm]
    nuevas[index] = { ...nuevas[index], [campo]: valor }
    setTallasForm(nuevas)
  }

  const eliminarTalla = (index) => {
    setTallasForm(tallasForm.filter((_, i) => i !== index))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio: parseFloat(form.precio),
      imagen_url: (imagenesForm.length > 0 ? imagenesForm[0].url : null) || null,
      genero: form.genero,
      marca_id: form.marca_id ? parseInt(form.marca_id) : null,
      categoria_id: form.categoria_id ? parseInt(form.categoria_id) : null,
    }

    if (editando === 'nuevo') {
      const { data: prod, error } = await supabase.from('productos').insert(payload).select().single()
      if (error) { alert('Error: ' + error.message); return }

      const tallasValidas = tallasForm.filter(t => t.talla.trim())
      if (tallasValidas.length > 0) {
        await supabase.from('producto_tallas').insert(
          tallasValidas.map(t => ({ producto_id: prod.id, talla: t.talla, stock: parseInt(t.stock) || 0 }))
        )
      }

      const imagenesValidas = imagenesForm.filter(img => img.url)
      if (imagenesValidas.length > 0) {
        await supabase.from('producto_imagenes').insert(
          imagenesValidas.map((img, i) => ({ producto_id: prod.id, url: img.url, orden: i }))
        )
      }
    } else {
      const { error } = await supabase.from('productos').update(payload).eq('id', editando)
      if (error) { alert('Error: ' + error.message); return }

      await supabase.from('producto_tallas').delete().eq('producto_id', editando)
      const tallasValidas = tallasForm.filter(t => t.talla.trim())
      if (tallasValidas.length > 0) {
        await supabase.from('producto_tallas').insert(
          tallasValidas.map(t => ({ producto_id: editando, talla: t.talla, stock: parseInt(t.stock) || 0 }))
        )
      }

      await supabase.from('producto_imagenes').delete().eq('producto_id', editando)
      const imagenesValidas = imagenesForm.filter(img => img.url)
      if (imagenesValidas.length > 0) {
        await supabase.from('producto_imagenes').insert(
          imagenesValidas.map((img, i) => ({ producto_id: editando, url: img.url, orden: i }))
        )
      }
    }

    setEditando(null)
    cargarProductos()
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Desactivar este producto?')) return
    const { error } = await supabase.from('productos').update({ activo: false }).eq('id', id)
    if (error) { alert('Error: ' + error.message); return }
    cargarProductos()
  }

  const agregarMarca = async () => {
    if (!nuevaMarca.trim()) return
    const slug = nuevaMarca.toLowerCase().replace(/\s+/g, '-')
    const { error } = await supabase.from('marcas').insert({ nombre: nuevaMarca.trim(), slug })
    if (error) { alert('Error: ' + error.message); return }
    setNuevaMarca('')
    cargarMarcas()
  }

  const cargarSecciones = async () => {
    const { data } = await supabase.from('secciones').select('*').order('orden')
    if (data) setSecciones(data)
  }

  const handleSeccionImagen = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSubiendoSec(true)
    const ext = file.name.split('.').pop()
    const name = `secciones/${Date.now()}.${ext}`
    await supabase.storage.from('productos').upload(name, file)
    const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(name)
    setSeccionForm(prev => ({ ...prev, imagen_url: publicUrl }))
    setSubiendoSec(false)
  }

  const guardarSeccion = async (e) => {
    e.preventDefault()
    const payload = {
      titulo: seccionForm.titulo,
      subtitulo: seccionForm.subtitulo,
      imagen_url: seccionForm.imagen_url || null,
      slug: seccionForm.slug || seccionForm.titulo.toLowerCase().replace(/\s+/g, '-'),
    }
    if (editandoSeccion) {
      await supabase.from('secciones').update(payload).eq('id', editandoSeccion)
    } else {
      await supabase.from('secciones').insert(payload)
    }
    setEditandoSeccion(null)
    setSeccionForm({ titulo: '', subtitulo: '', imagen_url: '', slug: '' })
    cargarSecciones()
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content modal-admin" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Administración</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className={`btn-tab ${vista === 'productos' ? 'active' : ''}`} onClick={() => setVista('productos')}>Productos</button>
            <button className={`btn-tab ${vista === 'marcas' ? 'active' : ''}`} onClick={() => setVista('marcas')}>Marcas</button>
            <button className={`btn-tab ${vista === 'secciones' ? 'active' : ''}`} onClick={() => { setVista('secciones'); cargarSecciones() }}>Inicio</button>
            <button className="modal-cerrar" onClick={onCerrar}>✕</button>
          </div>
        </div>

        {vista === 'marcas' && (
          <div style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Gestionar Marcas</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input type="text" placeholder="Nueva marca" value={nuevaMarca} onChange={e => setNuevaMarca(e.target.value)}
                style={{ flex: 1, padding: '0.7rem', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.9rem' }} />
              <button className="btn-primary" onClick={agregarMarca}>Agregar</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {marcas.map(m => (
                <span key={m.id} style={{ padding: '0.4rem 0.8rem', background: '#f0f0f0', borderRadius: 20, fontSize: '0.85rem' }}>
                  {m.nombre}
                </span>
              ))}
            </div>
          </div>
        )}

        {vista === 'secciones' && (
          <div style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Secciones de la página de inicio</h3>

            <form onSubmit={guardarSeccion} style={{ marginBottom: '2rem', padding: '1rem', background: '#f9f9f9', borderRadius: 8 }}>
              <h4>{editandoSeccion ? 'Editar sección' : 'Nueva sección'}</h4>
              <div className="admin-form-grid" style={{ marginTop: '0.75rem' }}>
                <input placeholder="Título (ej: Zapatillas de Hombre)" value={seccionForm.titulo}
                  onChange={e => setSeccionForm({ ...seccionForm, titulo: e.target.value })} required
                  style={{ padding: '0.7rem', border: '1px solid #ddd', borderRadius: 6 }} />
                <input placeholder="Subtítulo (opcional)" value={seccionForm.subtitulo}
                  onChange={e => setSeccionForm({ ...seccionForm, subtitulo: e.target.value })}
                  style={{ padding: '0.7rem', border: '1px solid #ddd', borderRadius: 6 }} />
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <label className="admin-upload-label" style={{ fontSize: '0.85rem' }}>
                  🖼️ Subir imagen de fondo
                  <input type="file" accept="image/*" onChange={handleSeccionImagen} hidden />
                </label>
                {subiendoSec && <span style={{ marginLeft: '0.5rem', color: '#888' }}>Subiendo...</span>}
                {seccionForm.imagen_url && (
                  <img src={seccionForm.imagen_url} alt="" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6, marginLeft: '0.5rem' }} />
                )}
              </div>
              <div className="admin-form-actions" style={{ marginTop: '0.75rem' }}>
                <button type="submit" className="btn-primary">
                  {editandoSeccion ? 'Guardar cambios' : 'Crear sección'}
                </button>
                {editandoSeccion && (
                  <button type="button" className="btn-vaciar" onClick={() => { setEditandoSeccion(null); setSeccionForm({ titulo: '', subtitulo: '', imagen_url: '', slug: '' }) }}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            <div className="secciones-admin-grid">
              {secciones.map(sec => (
                <div key={sec.id} className="seccion-admin-card">
                  <img src={sec.imagen_url || 'https://placehold.co/200x150/eee/999?text=Sin+imagen'} alt={sec.titulo} />
                  <div className="seccion-admin-info">
                    <strong>{sec.titulo}</strong>
                    {sec.subtitulo && <small>{sec.subtitulo}</small>}
                  </div>
                  <div className="seccion-admin-acciones">
                    <button className="btn-small" onClick={() => {
                      setEditandoSeccion(sec.id)
                      setSeccionForm({ titulo: sec.titulo, subtitulo: sec.subtitulo || '', imagen_url: sec.imagen_url || '', slug: sec.slug })
                    }}>✏️</button>
                    <button className="btn-small" onClick={async () => {
                      await supabase.from('secciones').delete().eq('id', sec.id)
                      cargarSecciones()
                    }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {vista === 'productos' && (
          <>
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
                  <select value={form.genero} onChange={e => setForm({ ...form, genero: e.target.value })} style={selectStyle}>
                    <option value="unisex">Unisex</option>
                    <option value="varon">Varón</option>
                    <option value="mujer">Mujer</option>
                  </select>
                </div>

                <div className="admin-form-grid">
                  <select value={form.marca_id} onChange={e => setForm({ ...form, marca_id: e.target.value })} style={selectStyle}>
                    <option value="">Sin marca</option>
                    {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                  <select value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })} style={selectStyle}>
                    <option value="">Sin categoría</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>

                <div className="admin-upload">
                  <label className="admin-upload-label">
                    📸 Subir imágenes (puedes seleccionar varias)
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={subiendo} hidden />
                  </label>
                  {subiendo && <p style={{ color: '#888', fontSize: '0.85rem' }}>Subiendo imágenes...</p>}
                  {imagenesForm.length > 0 && (
                    <div className="admin-imagenes-grid">
                      {imagenesForm.map((img, i) => (
                        <div key={img.id || i} className="admin-imagen-item">
                          <img src={img.url} alt={`Foto ${i + 1}`} />
                          <button type="button" className="admin-img-delete" onClick={() => eliminarImagenForm(i)}>✕</button>
                          {i === 0 && <span className="admin-img-main">Principal</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="admin-tallas">
                  <h4>Tallas y Stock</h4>
                  {tallasForm.map((t, i) => (
                    <div key={i} className="admin-talla-row">
                      <input type="text" placeholder="Talla (38, S, M...)" value={t.talla}
                        onChange={e => actualizarTalla(i, 'talla', e.target.value)} style={{ flex: 1 }} />
                      <input type="number" placeholder="Stock" value={t.stock}
                        onChange={e => actualizarTalla(i, 'stock', e.target.value)} style={{ width: 80 }} />
                      <button type="button" className="btn-small" onClick={() => eliminarTalla(i)}>🗑️</button>
                    </div>
                  ))}
                  <button type="button" className="btn-vaciar" onClick={agregarTalla} style={{ marginTop: '0.5rem' }}>
                    + Agregar talla
                  </button>
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
                    <th>Marca</th>
                    <th>Género</th>
                    <th>Precio</th>
                    <th>Activo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map(p => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.imagen_url && <img src={p.imagen_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />}</td>
                      <td>{p.nombre}</td>
                      <td>{p.marcas?.nombre || '-'}</td>
                      <td>{p.genero}</td>
                      <td>${Number(p.precio).toFixed(2)}</td>
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
          </>
        )}
      </div>
    </div>
  )
}

const selectStyle = {
  padding: '0.7rem', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.9rem', fontFamily: 'inherit', background: 'white',
}
