import { supabase } from '../lib/supabase'

const CAMPOS =
  'user_id,nome_empresa,nome_responsavel,telefone,whatsapp,email,documento,endereco'

// Perfil da empresa do usuário logado (a RLS já filtra pela conta).
// Retorna null se o perfil ainda não foi preenchido.
export async function buscarPerfil() {
  const { data, error } = await supabase
    .from('perfis_empresa')
    .select(CAMPOS)
    .maybeSingle()

  if (error) throw error
  return data
}

function limpo(valor) {
  const t = String(valor ?? '').trim()
  return t === '' ? null : t
}

// Cria o perfil se ainda não existir, ou atualiza se já existir (user_id é a chave).
export async function salvarPerfil(userId, dados) {
  const { data, error } = await supabase
    .from('perfis_empresa')
    .upsert(
      {
        user_id: userId,
        nome_empresa: limpo(dados.nome_empresa),
        nome_responsavel: limpo(dados.nome_responsavel),
        telefone: limpo(dados.telefone),
        whatsapp: limpo(dados.whatsapp),
        email: limpo(dados.email),
        documento: limpo(dados.documento),
        endereco: limpo(dados.endereco),
      },
      { onConflict: 'user_id' }
    )
    .select(CAMPOS)
    .single()

  if (error) throw error
  return data
}
