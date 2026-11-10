import { supabase } from '../lib/supabase'

// Todas as funções abaixo chamam funções do banco (admin_*) que só funcionam
// para contas de administrador. Para qualquer outra conta, o banco recusa.
async function chamar(nome, parametros) {
  const { data, error } = await supabase.rpc(nome, parametros)
  if (error) throw error
  return data
}

export async function listarUsuarios() {
  return (await chamar('admin_listar_usuarios')) ?? []
}

export async function listarPlanos() {
  return (await chamar('admin_listar_planos')) ?? []
}

export async function listarAuditoria(limite = 100) {
  return (await chamar('admin_listar_auditoria', { p_limite: limite })) ?? []
}

// Muda plano, status e vencimento de uma licença que já existe.
export async function atualizarLicenca(userId, { plano, status, expiraEm }) {
  return chamar('admin_atualizar_licenca', {
    p_user_id: userId,
    p_plano_codigo: plano,
    p_status: status,
    p_expira_em: expiraEm,
  })
}

// Cria a licença de quem não tem nenhuma (ou refaz uma quebrada).
export async function criarLicenca(userId, { plano, status, expiraEm }) {
  return chamar('admin_criar_ou_reparar_licenca', {
    p_user_id: userId,
    p_plano_codigo: plano,
    p_status: status,
    p_expira_em: expiraEm,
  })
}

export async function atualizarPlano(codigo, { limiteMensal, diasTeste, ativo }) {
  return chamar('admin_atualizar_plano', {
    p_codigo: codigo,
    p_limite_orcamentos_mensal: limiteMensal,
    p_dias_teste: diasTeste,
    p_ativo: ativo,
  })
}
