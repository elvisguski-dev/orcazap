import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { traduzirErro } from '../lib/erros'

const TITULOS = {
  entrar: 'Entrar na sua conta',
  cadastrar: 'Criar conta',
  recuperar: 'Recuperar senha',
}

const BOTOES = {
  entrar: 'Entrar',
  cadastrar: 'Criar conta',
  recuperar: 'Enviar link de recuperação',
}

export default function Login() {
  const { signIn, signUp, resetPassword } = useAuth()

  const [modo, setModo] = useState('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  function trocarModo(novoModo) {
    setModo(novoModo)
    setErro('')
    setAviso('')
    setSenha('')
    setConfirmacao('')
  }

  async function enviar(evento) {
    evento.preventDefault()
    setErro('')
    setAviso('')

    if (modo === 'cadastrar' && senha !== confirmacao) {
      setErro('As senhas não conferem.')
      return
    }

    setEnviando(true)
    try {
      const emailLimpo = email.trim()

      if (modo === 'entrar') {
        await signIn(emailLimpo, senha)
      } else if (modo === 'cadastrar') {
        const dados = await signUp(emailLimpo, senha)
        const jaExistia = dados.user?.identities && dados.user.identities.length === 0
        if (jaExistia) {
          setErro('Este e-mail já possui cadastro. Tente entrar ou recuperar a senha.')
        } else if (!dados.session) {
          setAviso(
            'Conta criada! Enviamos um e-mail de confirmação. Confirme o e-mail e depois entre.'
          )
        }
      } else {
        await resetPassword(emailLimpo)
        setAviso(
          'Se este e-mail estiver cadastrado, você receberá um link para criar uma nova senha.'
        )
      }
    } catch (e) {
      setErro(traduzirErro(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="auth-tela">
      <div className="auth-card">
        <div className="logo logo-centro">
          Orça<span>Zap</span>
        </div>
        <h1 className="auth-titulo">{TITULOS[modo]}</h1>
        <p className="auth-subtitulo">Orçamentos simples para o seu negócio.</p>

        <form onSubmit={enviar} className="formulario">
          <label className="campo">
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          {modo !== 'recuperar' && (
            <label className="campo">
              <span>Senha</span>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                minLength={6}
                required
              />
            </label>
          )}

          {modo === 'cadastrar' && (
            <label className="campo">
              <span>Confirmar senha</span>
              <input
                type="password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>
          )}

          {erro && (
            <div className="aviso aviso-erro" role="alert">
              {erro}
            </div>
          )}
          {aviso && <div className="aviso aviso-sucesso">{aviso}</div>}

          <button type="submit" className="botao botao-primario" disabled={enviando}>
            {enviando ? 'Aguarde…' : BOTOES[modo]}
          </button>
        </form>

        <div className="auth-links">
          {modo === 'entrar' && (
            <>
              <button type="button" className="botao-link" onClick={() => trocarModo('recuperar')}>
                Esqueci minha senha
              </button>
              <button type="button" className="botao-link" onClick={() => trocarModo('cadastrar')}>
                Criar uma conta
              </button>
            </>
          )}
          {modo !== 'entrar' && (
            <button type="button" className="botao-link" onClick={() => trocarModo('entrar')}>
              Voltar para o login
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
