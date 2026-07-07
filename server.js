import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { MercadoPagoConfig, Preference } from 'mercadopago'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(express.static(join(__dirname, 'dist')))

// Mercado Pago
const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

if (mpAccessToken) {
  const client = new MercadoPagoConfig({ accessToken: mpAccessToken })

  app.post('/api/create-preference', async (req, res) => {
    try {
      const { items, pedidoId, clienteEmail, clienteNombre } = req.body

      const preference = new Preference(client)
      const result = await preference.create({
        body: {
          items: items.map(item => ({
            title: item.nombre,
            quantity: Number(item.cantidad),
            unit_price: Number(item.precio),
            currency_id: 'ARS',
          })),
          payer: {
            email: clienteEmail,
            name: clienteNombre,
          },
          back_urls: {
            success: `${req.protocol}://${req.get('host')}/pago-exitoso?pedido_id=${pedidoId}`,
            failure: `${req.protocol}://${req.get('host')}/pago-fallido?pedido_id=${pedidoId}`,
            pending: `${req.protocol}://${req.get('host')}/pago-pendiente?pedido_id=${pedidoId}`,
          },
          auto_return: 'approved',
          external_reference: String(pedidoId),
          notification_url: `${req.protocol}://${req.get('host')}/api/webhook-mercadopago`,
        },
      })

      res.json({
        id: result.id,
        init_point: result.init_point,
      })
    } catch (error) {
      console.error('Error Mercado Pago:', error)
      res.status(500).json({ error: 'Error al crear preferencia de pago' })
    }
  })

  app.post('/api/webhook-mercadopago', async (req, res) => {
    console.log('Webhook recibido:', req.body)
    res.sendStatus(200)
  })
} else {
  console.warn('MERCADOPAGO_ACCESS_TOKEN no configurado. El pago no funcionará.')
}

// Rutas de redirección post-pago (SPA)
app.get('/pago-exitoso', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})
app.get('/pago-fallido', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})
app.get('/pago-pendiente', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

// API para verificar config de Mercado Pago
app.get('/api/mp-config', (req, res) => {
  res.json({
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || '',
    configurado: !!mpAccessToken,
  })
})

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})
