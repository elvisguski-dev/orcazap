// Traduz as mensagens de erro mais comuns do Supabase para português.
export function traduzirErro(erro) {
  const mensagem = (erro?.message || '').toLowerCase()
  const codigo = erro?.code || ''

  if (mensagem.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.'
  }
  if (mensagem.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.'
  }
  if (mensagem.includes('user already registered')) {
    return 'Este e-mail já possui cadastro. Tente entrar ou recuperar a senha.'
  }
  if (mensagem.includes('password should be at least')) {
    return 'A senha é muito curta. Use pelo menos 6 caracteres.'
  }
  if (mensagem.includes('same password') || mensagem.includes('different from the old')) {
    return 'A nova senha precisa ser diferente da senha atual.'
  }
  if (codigo === 'weak_password' || mensagem.includes('weak')) {
    return 'Senha muito fraca. Use uma senha mais forte.'
  }
  if (codigo === 'over_email_send_rate_limit' || mensagem.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
  }
  if (mensagem.includes('unable to validate email')) {
    return 'E-mail inválido.'
  }
  if (mensagem.includes('failed to fetch') || mensagem.includes('network')) {
    return 'Sem conexão com o servidor. Verifique sua internet.'
  }
  // Política de segurança (RLS) do banco: licença inválida ou sem permissão.
  if (codigo === '42501' || mensagem.includes('row-level security')) {
    return 'Ação não permitida. Verifique se a sua licença está ativa e dentro do limite do plano.'
  }
  return erro?.message || 'Ocorreu um erro inesperado. Tente novamente.'
}
