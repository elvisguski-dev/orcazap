import { randomUUID } from 'node:crypto'
import { configObrigatoria, mercadoPago, responder, supabaseRest } from './_lib.js'

const PRECO_MENSAL = 24.9
const PLANO = 'profissional'

export default async function handler(req, res) {
  if (req.method !== 'POST') return responder(res, 405, { error: 'Método não permitido.' })

  try {
    const authorization = req.headers.authorization || ''
    const jwt = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
    if (!jwt) return responder(res, 401, { error: 'Entre na sua conta para assinar.' })

    const base = configObrigatoria('SUPABASE_URL').replace(/\/$/, '')
    const anonKey = process.env.SUPABASE_ANON_KEY || configObrigatoria('VITE_SUPABASE_ANON_KEY')
    const authResponse = await fetch(`${base}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${jwt}` },
    })
    if (!authResponse.ok) return responder(res, 401, { error: 'Sua sessão expirou. Entre novamente.' })
    const user = await authResponse.json()
    if (!user.id || !user.email) return responder(res, 400, { error: 'A conta precisa ter um e-mail válido.' })

    const externalReference = randomUUID()
    const site = configObrigatoria('APP_URL').replace(/\/$/, '')
    const assinatura = await mercadoPago('/preapproval', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': externalReference },
      body: JSON.stringify({
        reason: 'OrçaZap Profissional — assinatura mensal',
        external_reference: externalReference,
        payer_email: user.email,
        auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: PRECO_MENSAL, currency_id: 'BRL' },
        back_url: `${site}/?assinatura=retorno`,
        status: 'pending',
      }),
    })

    await supabaseRest('assinaturas?on_conflict=mp_preapproval_id', {
      method: 'POST',
      body: [{
        user_id: user.id,
        mp_preapproval_id: assinatura.id,
        external_reference: externalReference,
        plano_codigo: PLANO,
        status: assinatura.status || 'pending',
      }],
    })
    return responder(res, 200, { checkoutUrl: assinatura.init_point })
  } catch (error) {
    console.error('Falha ao iniciar assinatura:', error.message)
    return responder(res, 500, { error: 'Não foi possível iniciar o pagamento. Tente novamente.' })
  }
}
