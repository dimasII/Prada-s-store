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

-- 7. POLÍTICAS RLS (Row Level Security)
-- Habilitar RLS en todas las tablas
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;

-- Política: todos pueden ver productos activos
CREATE POLICY "Productos visibles para todos" ON productos
  FOR SELECT USING (activo = true);

-- Política: todos pueden ver categorías
CREATE POLICY "Categorías visibles para todos" ON categorias
  FOR SELECT USING (true);

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
