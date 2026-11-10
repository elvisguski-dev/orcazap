// Calcula os números do Dashboard a partir da lista de orçamentos.
// Função pura (não depende da tela), por isso é fácil de testar.
export function calcularResumo(orcamentos, agora = new Date()) {
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

  const grupo = () => ({ qtd: 0, valor: 0 })
  const resumo = {
    total: orcamentos.length,
    valorTotal: 0,
    Pendente: grupo(),
    Aprovado: grupo(),
    Recusado: grupo(),
    criadosNoMes: 0,
    aprovadoNoMes: 0,
    taxaAprovacao: 0,
  }

  for (const o of orcamentos) {
    const valor = Number(o.valor) || 0
    // Qualquer status desconhecido (ou vazio) conta como Pendente.
    const status = ['Pendente', 'Aprovado', 'Recusado'].includes(o.status) ? o.status : 'Pendente'

    resumo[status].qtd += 1
    resumo[status].valor += valor
    resumo.valorTotal += valor

    if (new Date(o.created_at) >= inicioMes) {
      resumo.criadosNoMes += 1
      if (status === 'Aprovado') resumo.aprovadoNoMes += valor
    }
  }

  resumo.taxaAprovacao =
    resumo.total === 0 ? 0 : Math.round((resumo.Aprovado.qtd / resumo.total) * 100)

  return resumo
}
