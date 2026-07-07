-- ============================================
-- ESQUEMA DE BASE DE DATOS - PRADA'S STORE
-- Ejecutar esto en el SQL Editor de Supabase
-- ============================================

-- 1. TABLA DE MARCAS
CREATE TABLE marcas (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE CATEGORÍAS
CREATE TABLE categorias (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE PRODUCTOS
CREATE TABLE productos (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  imagen_url TEXT,
  genero TEXT DEFAULT 'unisex' CHECK (genero IN ('varon', 'mujer', 'unisex')),
  marca_id BIGINT REFERENCES marcas(id) ON DELETE SET NULL,
  categoria_id BIGINT REFERENCES categorias(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE TALLAS POR PRODUCTO (stock por talla)
CREATE TABLE producto_tallas (
  id BIGSERIAL PRIMARY KEY,
  producto_id BIGINT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  talla TEXT NOT NULL,
  stock INT DEFAULT 0,
  UNIQUE(producto_id, talla)
);

-- 5. TABLA DE CLIENTES (con autenticación)
CREATE TABLE clientes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefono TEXT,
  direccion TEXT,
  ciudad TEXT,
  codigo_postal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA DE PEDIDOS
CREATE TABLE pedidos (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT REFERENCES clientes(id) ON DELETE SET NULL,
  total DECIMAL(10,2) NOT NULL,
  costo_envio DECIMAL(10,2) DEFAULT 0,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado')),
  direccion_envio TEXT NOT NULL,
  ciudad_envio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA DE DETALLES DEL PEDIDO
CREATE TABLE pedido_items (
  id BIGSERIAL PRIMARY KEY,
  pedido_id BIGINT REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id BIGINT REFERENCES productos(id) ON DELETE SET NULL,
  talla TEXT,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL
);

-- 8. TABLA DE PAGOS (Mercado Pago)
CREATE TABLE pagos (
  id BIGSERIAL PRIMARY KEY,
  pedido_id BIGINT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  monto DECIMAL(10,2) NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'reembolsado')),
  referencia_mp TEXT,
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLA DE ADMINS
CREATE TABLE admins (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ÍNDICES
CREATE INDEX idx_productos_marca ON productos(marca_id);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_genero ON productos(genero);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_producto_tallas_producto ON producto_tallas(producto_id);
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pagos_pedido ON pagos(pedido_id);
CREATE INDEX idx_admins_user_id ON admins(user_id);
CREATE INDEX idx_clientes_user_id ON clientes(user_id);

-- 11. FUNCIÓN PARA VERIFICAR SI UN USUARIO ES ADMIN
CREATE OR REPLACE FUNCTION es_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. POLÍTICAS RLS
ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_tallas ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- MARCAS: todos ven, solo admins modifican
CREATE POLICY "Marcas SELECT publico" ON marcas FOR SELECT USING (true);
CREATE POLICY "Marcas INSERT admin" ON marcas FOR INSERT WITH CHECK (es_admin());
CREATE POLICY "Marcas UPDATE admin" ON marcas FOR UPDATE USING (es_admin());
CREATE POLICY "Marcas DELETE admin" ON marcas FOR DELETE USING (es_admin());

-- CATEGORIAS: todos ven, solo admins modifican
CREATE POLICY "Categorias SELECT publico" ON categorias FOR SELECT USING (true);
CREATE POLICY "Categorias INSERT admin" ON categorias FOR INSERT WITH CHECK (es_admin());
CREATE POLICY "Categorias UPDATE admin" ON categorias FOR UPDATE USING (es_admin());
CREATE POLICY "Categorias DELETE admin" ON categorias FOR DELETE USING (es_admin());

-- PRODUCTOS: todos ven activos, solo admins insert/update/delete
CREATE POLICY "Productos SELECT publico" ON productos FOR SELECT USING (activo = true);
CREATE POLICY "Productos SELECT admin" ON productos FOR SELECT USING (es_admin());
CREATE POLICY "Productos INSERT admin" ON productos FOR INSERT WITH CHECK (es_admin());
CREATE POLICY "Productos UPDATE admin" ON productos FOR UPDATE USING (es_admin());
CREATE POLICY "Productos DELETE admin" ON productos FOR DELETE USING (es_admin());

-- TALLAS: todos ven, solo admins modifican
CREATE POLICY "Tallas SELECT publico" ON producto_tallas FOR SELECT USING (true);
CREATE POLICY "Tallas INSERT admin" ON producto_tallas FOR INSERT WITH CHECK (es_admin());
CREATE POLICY "Tallas UPDATE admin" ON producto_tallas FOR UPDATE USING (es_admin());
CREATE POLICY "Tallas DELETE admin" ON producto_tallas FOR DELETE USING (es_admin());

-- CLIENTES: cada quien ve su propio perfil, admins ven todo
CREATE POLICY "Clientes SELECT propio" ON clientes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Clientes SELECT admin" ON clientes FOR SELECT USING (es_admin());
CREATE POLICY "Clientes INSERT propio" ON clientes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Clientes UPDATE propio" ON clientes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Clientes UPDATE admin" ON clientes FOR UPDATE USING (es_admin());

-- PEDIDOS: clientes ven sus pedidos, admins ven todo
CREATE POLICY "Pedidos SELECT cliente" ON pedidos FOR SELECT USING (
  cliente_id IN (SELECT id FROM clientes WHERE user_id = auth.uid())
);
CREATE POLICY "Pedidos SELECT admin" ON pedidos FOR SELECT USING (es_admin());
CREATE POLICY "Pedidos INSERT cliente" ON pedidos FOR INSERT WITH CHECK (
  cliente_id IN (SELECT id FROM clientes WHERE user_id = auth.uid())
);
CREATE POLICY "Pedidos UPDATE admin" ON pedidos FOR UPDATE USING (es_admin());

-- PEDIDO ITEMS: clientes ven sus items, admins ven todo
CREATE POLICY "Items SELECT" ON pedido_items FOR SELECT USING (
  pedido_id IN (SELECT id FROM pedidos WHERE cliente_id IN (SELECT id FROM clientes WHERE user_id = auth.uid()))
  OR es_admin()
);
CREATE POLICY "Items INSERT" ON pedido_items FOR INSERT WITH CHECK (
  pedido_id IN (SELECT id FROM pedidos WHERE cliente_id IN (SELECT id FROM clientes WHERE user_id = auth.uid()))
);

-- PAGOS: clientes ven sus pagos, admins ven todo
CREATE POLICY "Pagos SELECT" ON pagos FOR SELECT USING (
  pedido_id IN (SELECT id FROM pedidos WHERE cliente_id IN (SELECT id FROM clientes WHERE user_id = auth.uid()))
  OR es_admin()
);
CREATE POLICY "Pagos INSERT" ON pagos FOR INSERT WITH CHECK (
  pedido_id IN (SELECT id FROM pedidos WHERE cliente_id IN (SELECT id FROM clientes WHERE user_id = auth.uid()))
);
CREATE POLICY "Pagos UPDATE admin" ON pagos FOR UPDATE USING (es_admin());

-- ADMINS: solo admins
CREATE POLICY "Admins SELECT" ON admins FOR SELECT USING (es_admin());

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================
INSERT INTO marcas (nombre, slug) VALUES
  ('Nike', 'nike'),
  ('Adidas', 'adidas'),
  ('Puma', 'puma'),
  ('Vans', 'vans');

INSERT INTO categorias (nombre, slug) VALUES
  ('Zapatillas', 'zapatillas'),
  ('Ropa', 'ropa'),
  ('Accesorios', 'accesorios'),
  ('Bolsos', 'bolsos');

INSERT INTO productos (nombre, descripcion, precio, genero, marca_id, categoria_id) VALUES
  ('Air Max 270', 'Zapatillas Nike con amortiguación', 129.99, 'varon', 1, 1),
  ('Ultraboost 22', 'Zapatillas Adidas cómodas', 159.99, 'unisex', 2, 1),
  ('Suede Classic', 'Zapatillas Puma clásicas', 79.99, 'mujer', 3, 1),
  ('Old Skool', 'Zapatillas Vans icónicas', 69.99, 'unisex', 4, 1);

INSERT INTO producto_tallas (producto_id, talla, stock) VALUES
  (1, '38', 10), (1, '39', 15), (1, '40', 20), (1, '41', 12), (1, '42', 8),
  (2, '36', 5), (2, '37', 8), (2, '38', 12), (2, '39', 15), (2, '40', 10),
  (3, '35', 8), (3, '36', 12), (3, '37', 15), (3, '38', 10),
  (4, '38', 15), (4, '39', 20), (4, '40', 18), (4, '41', 10), (4, '42', 5);
