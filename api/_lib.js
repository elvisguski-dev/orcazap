export function responder(res, status, body) {
  res.status(status).json(body)
}

export function configObrigatoria(nome) {
  const valor = process.env[nome]
  if (!valor) throw new Error(`Variável ${nome} não configurada`)
  return valor
}

export async function supabaseRest(path, { method = 'GET', body, token } = {}) {
  const base = configObrigatoria('SUPABASE_URL').replace(/\/$/, '')
  const key = configObrigatoria('SUPABASE_SERVICE_ROLE_KEY')
  const response = await fetch(`${base}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token || key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

export async function mercadoPago(path, options = {}) {
  const token = configObrigatoria('MERCADOPAGO_ACCESS_TOKEN')
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const data = await response.json()
  if (!response.ok) throw new Error(`Mercado Pago ${response.status}: ${JSON.stringify(data)}`)
  return data
}
