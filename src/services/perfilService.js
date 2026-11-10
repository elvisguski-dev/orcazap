import { supabase } from '../lib/supabase'

// Perfil da empresa do usuário logado (a RLS já filtra pela conta).
// Retorna null se o perfil ainda não foi preenchido.
export async function buscarPerfil() {
  const { data, error } = await supabase
    .from('perfis_empresa')
    .select('*')
    .maybeSingle()

  if (error) throw error
  return data
}
