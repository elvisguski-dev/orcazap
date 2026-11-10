import { supabase } from '../lib/supabase'

const CAMPOS = 'id,nome,descricao,preco,ativo,created_at'

function preparar(dados) {
  const descricao = String(dados.descricao ?? '').trim()
  return {
    nome: String(dados.nome ?? '').trim(),
    descricao: descricao === '' ? null : descricao,
    preco: Number(dados.preco),
    ativo: Boolean(dados.ativo),
  }
}

export async function listarServicos() {
  const { data, error } = await supabase
    .from('servicos')
    .select(CAMPOS)
    .order('nome', { ascending: true })

  if (error) throw error
  // O Supabase devolve "numeric" como número ou texto, conforme o caso.
  return data.map((s) => ({ ...s, preco: Number(s.preco) }))
}

export async function criarServico(dados) {
  const { data, error } = await supabase
    .from('servicos')
    .insert(preparar(dados))
    .select(CAMPOS)
    .single()

  if (error) throw error
  return { ...data, preco: Number(data.preco) }
}

export async function atualizarServico(id, dados) {
  const { data, error } = await supabase
    .from('servicos')
    .update(preparar(dados))
    .eq('id', id)
    .select(CAMPOS)
    .single()

  if (error) throw error
  return { ...data, preco: Number(data.preco) }
}

// Itens de orçamentos antigos continuam existindo (servico_id vira nulo).
export async function excluirServico(id) {
  const { error } = await supabase.from('servicos').delete().eq('id', id)
  if (error) throw error
}
