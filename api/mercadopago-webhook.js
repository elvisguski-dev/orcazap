import { createHmac, timingSafeEqual } from 'node:crypto'
import { configObrigatoria, mercadoPago, responder, supabaseRest } from './_lib.js'

function assinaturaValida(req, id) {
  const secret = configObrigatoria('MERCADOPAGO_WEBHOOK_SECRET')
  const signature = String(req.headers['x-signature'] || '')
  const requestId = String(req.headers['x-request-id'] || '')
  const values = Object.fromEntries(signature.split(',').map((part) => part.trim().split('=')))
  if (!values.ts || !values.v1 || !requestId || !id) return false
  const manifest = `id:${String(id).toLowerCase()};request-id:${requestId};ts:${values.ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(values.v1)
  return a.length === b.length && timingSafeEqual(a, b)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return responder(res, 405, { error: 'Método não permitido.' })

  try {
    const type = req.query.type || req.body?.type || req.body?.topic
    const id = req.query['data.id'] || req.body?.data?.id || req.query.id
    if (!assinaturaValida(req, id)) return responder(res, 401, { error: 'Assinatura do webhook inválida.' })

    if (type === 'subscription_authorized_payment') {
      const pagamento = await mercadoPago(`/authorized_payments/${encodeURIComponent(id)}`)
      if (pagamento.status !== 'approved' || !pagamento.preapproval_id) return responder(res, 200, { received: true })

      const rows = await supabaseRest(
        `assinaturas?mp_preapproval_id=eq.${encodeURIComponent(pagamento.preapproval_id)}&select=user_id,plano_codigo,status`,
      )
      const assinatura = rows?.[0]
      if (!assinatura) return responder(res, 503, { error: 'Assinatura ainda não sincronizada.' })

      const processado = await supabaseRest('rpc/processar_pagamento_assinatura', {
        method: 'POST',
        body: {
          p_pagamento_id: String(id),
          p_user_id: assinatura.user_id,
          p_plano_codigo: assinatura.plano_codigo,
          p_aprovado_em: pagamento.date_approved || new Date().toISOString(),
        },
      })
      return responder(res, 200, { received: true, processed: Boolean(processado) })
    }

    if (type === 'subscription_preapproval') {
      const atual = await mercadoPago(`/preapproval/${encodeURIComponent(id)}`)
      const rows = await supabaseRest(
        `assinaturas?mp_preapproval_id=eq.${encodeURIComponent(id)}&select=user_id,status`,
      )
      const registro = rows?.[0]
      if (registro) {
        await supabaseRest(`assinaturas?mp_preapproval_id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH', body: { status: atual.status },
        })
        // A licença conserva o período já pago e expira na data registrada.
      }
    }

    return responder(res, 200, { received: true })
  } catch (error) {
    console.error('Falha no webhook Mercado Pago:', error.message)
    return responder(res, 500, { error: 'Falha ao processar notificação.' })
  }
}
