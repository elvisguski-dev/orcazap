import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { traduzirErro } from '../lib/erros'

// Exibida quando o usuário abre o link de recuperação recebido por e-mail
// (evento PASSWORD_RECOVERY do Supabase).
export default function ResetPassword() {
  const { updatePassword, signOut } = useAuth()

  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function enviar(evento) {
    evento.preventDefault()
    setErro('')

    if (senha !== confirmacao) {
      setErro('As senhas não conferem.')
      return
    }

    setEnviando(true)
    try {
      await updatePassword(senha)
      // Ao concluir, o app sai desta tela sozinho e abre o sistema.
    } catch (e) {
      setErro(traduzirErro(e))
      setEnviando(false)
    }
  }

  return (
    <div className="auth-tela">
      <div className="auth-card">
        <div className="logo logo-centro">
          Orça<span>Zap</span>
        </div>
        <h1 className="auth-titulo">Criar nova senha</h1>
        <p className="auth-subtitulo">Escolha uma nova senha para a sua conta.</p>

        <form onSubmit={enviar} className="formulario">
          <label className="campo">
            <span>Nova senha</span>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>

          <label className="campo">
            <span>Confirmar nova senha</span>
            <input
              type="password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>

          {erro && (
            <div className="aviso aviso-erro" role="alert">
              {erro}
            </div>
          )}

          <button type="submit" className="botao botao-primario" disabled={enviando}>
            {enviando ? 'Salvando…' : 'Salvar nova senha'}
          </button>
        </form>

        <div className="auth-links">
          <button type="button" className="botao-link" onClick={signOut}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
