import { supabase } from '../lib/supabase'

const NOMES_PLANOS = {
  teste: 'Teste',
  basico: 'Básico',
  profissional: 'Profissional',
  empresa: 'Empresa',
}

export function nomeDoPlano(codigo) {
  return NOMES_PLANOS[codigo] || codigo || '—'
}

// Chama a função resumo_uso_licenca() do banco.
// Retorna { plano, status, limite_mensal, usados_no_mes, restantes, expira_em }
// ou null quando o usuário não tem licença válida em um plano ativo.
export async function buscarResumoUso() {
  const { data, error } = await supabase.rpc('resumo_uso_licenca')
  if (error) throw error

  const linha = Array.isArray(data) ? data[0] : data
  if (!linha) return null

  return {
    plano: linha.plano,
    status: linha.status,
    limite_mensal: linha.limite_mensal === null ? null : Number(linha.limite_mensal),
    usados_no_mes: Number(linha.usados_no_mes),
    restantes: linha.restantes === null ? null : Number(linha.restantes),
    expira_em: linha.expira_em,
  }
}
