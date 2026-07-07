-- ============================================
-- ESQUEMA DE BASE DE DATOS - PRADA'S STORE
-- Ejecutar esto en el SQL Editor de Supabase
-- ============================================

-- 1. TABLA DE CATEGORÍAS
CREATE TABLE categorias (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE PRODUCTOS
CREATE TABLE productos (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  imagen_url TEXT,
  categoria_id BIGINT REFERENCES categorias(id) ON DELETE SET NULL,
  stock INT DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE CLIENTES
CREATE TABLE clientes (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefono TEXT,
  direccion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE PEDIDOS
CREATE TABLE pedidos (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT REFERENCES clientes(id) ON DELETE SET NULL,
  total DECIMAL(10,2) NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado')),
  direccion_envio TEXT NOT NULL,
  metodo_pago TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA DE DETALLES DEL PEDIDO
CREATE TABLE pedido_items (
  id BIGSERIAL PRIMARY KEY,
  pedido_id BIGINT REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id BIGINT REFERENCES productos(id) ON DELETE SET NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL
);

-- 6. ÍNDICES PARA RENDIMIENTO
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);

-- 6. TABLA DE ADMINS (vinculada con auth.users de Supabase)
CREATE TABLE admins (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ÍNDICES PARA RENDIMIENTO
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_admins_user_id ON admins(user_id);

-- 8. FUNCIÓN PARA VERIFICAR SI UN USUARIO ES ADMIN
CREATE OR REPLACE FUNCTION es_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. POLÍTICAS RLS (Row Level Security)
-- Habilitar RLS en todas las tablas
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Productos: todos ven activos, solo admins insert/update/delete
CREATE POLICY "Productos SELECT para todos" ON productos
  FOR SELECT USING (activo = true);
CREATE POLICY "Productos INSERT solo admins" ON productos
  FOR INSERT WITH CHECK (es_admin());
CREATE POLICY "Productos UPDATE solo admins" ON productos
  FOR UPDATE USING (es_admin());
CREATE POLICY "Productos DELETE solo admins" ON productos
  FOR DELETE USING (es_admin());

-- Categorías: todos pueden ver, solo admins modifican
CREATE POLICY "Categorias SELECT para todos" ON categorias
  FOR SELECT USING (true);
CREATE POLICY "Categorias INSERT solo admins" ON categorias
  FOR INSERT WITH CHECK (es_admin());
CREATE POLICY "Categorias UPDATE solo admins" ON categorias
  FOR UPDATE USING (es_admin());
CREATE POLICY "Categorias DELETE solo admins" ON categorias
  FOR DELETE USING (es_admin());

-- Clientes: solo admins pueden ver/modificar
CREATE POLICY "Clientes SELECT solo admins" ON clientes
  FOR SELECT USING (es_admin());
CREATE POLICY "Clientes INSERT cualquiera" ON clientes
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Clientes UPDATE solo admins" ON clientes
  FOR UPDATE USING (es_admin());

-- Pedidos: admins ven todo, clientes ven sus propios pedidos (por email)
CREATE POLICY "Pedidos SELECT solo admins" ON pedidos
  FOR SELECT USING (es_admin());
CREATE POLICY "Pedidos INSERT cualquiera" ON pedidos
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Pedidos UPDATE solo admins" ON pedidos
  FOR UPDATE USING (es_admin());

-- Pedido items: admins ven todo, cualquiera puede insertar (para checkout)
CREATE POLICY "Items SELECT solo admins" ON pedido_items
  FOR SELECT USING (es_admin());
CREATE POLICY "Items INSERT cualquiera" ON pedido_items
  FOR INSERT WITH CHECK (true);

-- Admins: solo admins pueden ver la tabla admins
CREATE POLICY "Admins SELECT solo admins" ON admins
  FOR SELECT USING (es_admin());

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================
INSERT INTO categorias (nombre, slug) VALUES
  ('Ropa', 'ropa'),
  ('Calzado', 'calzado'),
  ('Accesorios', 'accesorios'),
  ('Bolsos', 'bolsos');

INSERT INTO productos (nombre, descripcion, precio, categoria_id, stock, imagen_url) VALUES
  ('Camisa Clásica', 'Camisa de algodón de alta calidad', 39.99, 1, 50, NULL),
  ('Vestido Elegante', 'Vestido para ocasiones especiales', 59.99, 1, 30, NULL),
  ('Chaqueta de Cuero', 'Chaqueta genuina de cuero', 89.99, 1, 20, NULL),
  ('Zapatos Deportivos', 'Cómodos zapatos para entrenar', 49.99, 2, 40, NULL),
  ('Bolso de Mano', 'Bolso elegante para dama', 69.99, 4, 35, NULL),
  ('Gorra Moderna', 'Gorra ajustable y moderna', 19.99, 3, 100, NULL),
  ('Reloj Deportivo', 'Reloj resistente al agua', 129.99, 3, 15, NULL),
  ('Mochila Viajera', 'Mochila impermeable de 40L', 45.99, 4, 25, NULL);
