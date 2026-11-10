import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY

export const configuracaoOk = Boolean(url && chave)

// Se as variáveis do .env.local não existirem, o app mostra uma tela
// explicando o que falta, em vez de quebrar com uma tela branca.
export const supabase = createClient(
  url || 'http://localhost:54321',
  chave || 'chave-nao-configurada'
)
