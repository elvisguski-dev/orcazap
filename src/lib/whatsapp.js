import { formatarData, formatarMoeda } from './formatar'

// Deixa só os números e garante o código do Brasil (55).
// Retorna '' se o número não parecer um telefone válido.
export function normalizarTelefone(telefone) {
  let numeros = String(telefone ?? '').replace(/\D/g, '')
  if (!numeros) return ''

  // Remove zero de operadora/tronco no começo (ex.: 011...)
  numeros = numeros.replace(/^0+/, '')

  // DDD + número: 10 dígitos (fixo) ou 11 (celular)
  if (numeros.length === 10 || numeros.length === 11) numeros = `55${numeros}`

  // Com o 55: 12 ou 13 dígitos
  if (numeros.startsWith('55') && (numeros.length === 12 || numeros.length === 13)) {
    return numeros
  }
  return ''
}

function quantidadeParaTexto(quantidade) {
  return String(Number(quantidade)).replace('.', ',')
}

// Texto do orçamento para mandar no WhatsApp.
export function montarMensagem(orcamento, perfil) {
  const empresa = perfil?.nome_empresa || perfil?.nome_responsavel || ''
  const linhas = []

  linhas.push(`Olá, ${orcamento.cliente}!`)
  linhas.push(
    empresa
      ? `Segue o orçamento nº ${orcamento.id} de *${empresa}*:`
      : `Segue o seu orçamento nº ${orcamento.id}:`
  )
  linhas.push('')

  for (const item of orcamento.itens) {
    const subtotal = item.quantidade * item.valor_unitario
    linhas.push(
      `• ${item.descricao} — ${quantidadeParaTexto(item.quantidade)} x ${formatarMoeda(item.valor_unitario)} = ${formatarMoeda(subtotal)}`
    )
  }

  linhas.push('')
  linhas.push(`*Total: ${formatarMoeda(orcamento.valor)}*`)

  if (orcamento.validade) {
    linhas.push(`Válido até ${formatarData(orcamento.validade)}.`)
  }
  if (orcamento.observacoes) {
    linhas.push('')
    linhas.push(`Obs.: ${orcamento.observacoes}`)
  }

  const contato = perfil?.whatsapp || perfil?.telefone
  if (contato) {
    linhas.push('')
    linhas.push(`Qualquer dúvida, fale comigo: ${contato}`)
  }

  return linhas.join('\n')
}

// Link que abre o WhatsApp (app ou WhatsApp Web) com a mensagem pronta.
// Se o telefone do cliente não for válido, abre sem destinatário
// e o usuário escolhe o contato.
export function linkWhatsapp(orcamento, perfil) {
  const texto = encodeURIComponent(montarMensagem(orcamento, perfil))
  const numero = normalizarTelefone(orcamento.telefone)
  return numero ? `https://wa.me/${numero}?text=${texto}` : `https://wa.me/?text=${texto}`
}
