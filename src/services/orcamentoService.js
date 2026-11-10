import { supabase } from '../lib/supabase'

export const STATUS = ['Pendente', 'Aprovado', 'Recusado']

const CAMPOS =
  'id,created_at,cliente,telefone,valor,status,descricao,cliente_id,validade,observacoes'

function normalizar(o) {
  return { ...o, valor: Number(o.valor) }
}

export async function listarOrcamentos() {
  const { data, error } = await supabase
    .from('orcamentos')
    .select(CAMPOS)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data.map(normalizar)
}

// Retorna o orçamento com a lista de itens, ou null se não existir.
export async function buscarOrcamento(id) {
  const { data, error } = await supabase
    .from('orcamentos')
    .select(CAMPOS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const { data: itens, error: erroItens } = await supabase
    .from('itens_orcamento')
    .select('id,servico_id,descricao,quantidade,valor_unitario')
    .eq('orcamento_id', id)
    .order('id', { ascending: true })

  if (erroItens) throw erroItens

  return {
    ...normalizar(data),
    itens: itens.map((i) => ({
      ...i,
      quantidade: Number(i.quantidade),
      valor_unitario: Number(i.valor_unitario),
    })),
  }
}

// Cria (id vazio) ou atualiza um orçamento usando a função salvar_orcamento do banco.
// O banco recalcula o total e a descrição a partir dos itens.
// itens: [{ servicoId, descricao, quantidade, valorUnitario }]
export async function salvarOrcamento({
  id,
  clienteId,
  cliente,
  telefone,
  validade,
  observacoes,
  status,
  itens,
}) {
  const { data, error } = await supabase.rpc('salvar_orcamento', {
    p_orcamento_id: id ?? null,
    p_cliente: cliente,
    p_telefone: telefone || null,
    p_cliente_id: clienteId ?? null,
    p_validade: validade || null,
    p_observacoes: observacoes || null,
    p_status: status || null,
    p_itens: itens.map((i) => ({
      servico_id: i.servicoId ?? null,
      descricao: i.descricao,
      quantidade: i.quantidade,
      valor_unitario: i.valorUnitario,
    })),
  })

  if (error) throw error
  return data // id do orçamento
}

export async function atualizarStatus(id, status) {
  const { data, error } = await supabase
    .from('orcamentos')
    .update({ status })
    .eq('id', id)
    .select('id,status')
    .single()

  if (error) throw error
  return data
}

// Os itens são apagados junto (ON DELETE CASCADE).
export async function excluirOrcamento(id) {
  const { error } = await supabase.from('orcamentos').delete().eq('id', id)
  if (error) throw error
}
