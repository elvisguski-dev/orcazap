import { createClient } from '@supabase/supabase-js'

// Limpa o que veio do .env.local ou da Vercel: tira espaços, aspas e o
// "NOME=" que às vezes vai junto na colagem.
function limpar(valor, nome) {
  let texto = String(valor ?? '').trim()
  texto = texto.replace(new RegExp(`^${nome}\\s*=\\s*`), '')
  texto = texto.replace(/^["']+|["']+$/g, '')
  return texto.split(/\s+/)[0] || ''
}

function limparUrl(valor) {
  const achada = String(valor ?? '').match(/https?:\/\/[^\s"']+/)
  if (!achada) return ''
  // Fica só o endereço base (sem /rest/v1 e sem barra no final).
  return achada[0].replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
}

const url = limparUrl(import.meta.env.VITE_SUPABASE_URL)
const chave = limpar(import.meta.env.VITE_SUPABASE_ANON_KEY, 'VITE_SUPABASE_ANON_KEY')

// Explica o que está errado (ou vazio se estiver tudo certo).
function descobrirProblema() {
  if (!import.meta.env.VITE_SUPABASE_URL) return 'A variável VITE_SUPABASE_URL não foi encontrada.'
  if (!url) {
    return 'A variável VITE_SUPABASE_URL não tem um endereço válido. Ela deve ser só algo como https://xxxx.supabase.co'
  }
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return 'A variável VITE_SUPABASE_ANON_KEY não foi encontrada.'
  }
  if (!chave) return 'A variável VITE_SUPABASE_ANON_KEY está vazia.'
  if (/^sb_secret_/.test(chave) || chave.length > 300) {
    return 'A variável VITE_SUPABASE_ANON_KEY parece ser uma chave secreta ou um valor errado. Use só a chave pública (começa com sb_publishable_).'
  }
  return ''
}

export const problemaConfiguracao = descobrirProblema()
export const configuracaoOk = problemaConfiguracao === ''

// Se algo estiver errado, o app mostra uma tela explicando o que falta,
// em vez de quebrar com uma tela branca.
export const supabase = createClient(
  configuracaoOk ? url : 'http://localhost:54321',
  configuracaoOk ? chave : 'chave-nao-configurada'
)