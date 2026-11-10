import { supabase } from '../lib/supabase'

const CAMPOS = 'id,nome,telefone,email,documento,endereco,observacoes,created_at'

// Remove espaços e troca texto vazio por null (o banco aceita null nos opcionais).
function preparar(dados) {
  const limpo = (v) => {
    const t = String(v ?? '').trim()
    return t === '' ? null : t
  }
  return {
    nome: String(dados.nome ?? '').trim(),
    telefone: limpo(dados.telefone),
    email: limpo(dados.email),
    documento: limpo(dados.documento),
    endereco: limpo(dados.endereco),
    observacoes: limpo(dados.observacoes),
  }
}

// A RLS já devolve só os clientes do usuário logado.
export async function listarClientes() {
  const { data, error } = await supabase
    .from('clientes')
    .select(CAMPOS)
    .order('nome', { ascending: true })

  if (error) throw error
  return data
}

// O user_id é preenchido pelo banco (default auth.uid()).
export async function criarCliente(dados) {
  const { data, error } = await supabase
    .from('clientes')
    .insert(preparar(dados))
    .select(CAMPOS)
    .single()

  if (error) throw error
  return data
}

export async function atualizarCliente(id, dados) {
  const { data, error } = await supabase
    .from('clientes')
    .update(preparar(dados))
    .eq('id', id)
    .select(CAMPOS)
    .single()

  if (error) throw error
  return data
}

// Os orçamentos do cliente são mantidos (cliente_id vira nulo, o nome continua).
export async function excluirCliente(id) {
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) throw error
}
