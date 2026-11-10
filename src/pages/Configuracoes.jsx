import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { traduzirErro } from '../lib/erros'
import { buscarPerfil, salvarPerfil } from '../services/perfilService'

const PERFIL_VAZIO = {
  nome_empresa: '',
  nome_responsavel: '',
  telefone: '',
  whatsapp: '',
  email: '',
  documento: '',
  endereco: '',
}

export default function Configuracoes() {
  const { user, updatePassword } = useAuth()

  // ----- Dados da empresa -----
  const [form, setForm] = useState(PERFIL_VAZIO)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [salvo, setSalvo] = useState(false)

  // ----- Senha -----
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [erroSenha, setErroSenha] = useState('')
  const [senhaAlterada, setSenhaAlterada] = useState(false)

  useEffect(() => {
    let ativo = true
    buscarPerfil()
      .then((perfil) => {
        if (!ativo || !perfil) return
        setForm({
          nome_empresa: perfil.nome_empresa || '',
          nome_responsavel: perfil.nome_responsavel || '',
          telefone: perfil.telefone || '',
          whatsapp: perfil.whatsapp || '',
          email: perfil.email || '',
          documento: perfil.documento || '',
          endereco: perfil.endereco || '',
        })
      })
      .catch((e) => {
        if (ativo) setErro(traduzirErro(e))
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
    setSalvo(false)
  }

  async function salvar(evento) {
    evento.preventDefault()
    setErro('')
    setSalvo(false)
    setSalvando(true)
    try {
      await salvarPerfil(user.id, form)
      setSalvo(true)
    } catch (e) {
      setErro(traduzirErro(e))
    } finally {
      setSalvando(false)
    }
  }

  async function trocarSenha(evento) {
    evento.preventDefault()
    setErroSenha('')
    setSenhaAlterada(false)

    if (novaSenha !== confirmacao) {
      setErroSenha('As senhas não conferem.')
      return
    }

    setSalvandoSenha(true)
    try {
      await updatePassword(novaSenha)
      setNovaSenha('')
      setConfirmacao('')
      setSenhaAlterada(true)
    } catch (e) {
      setErroSenha(traduzirErro(e))
    } finally {
      setSalvandoSenha(false)
    }
  }

  return (
    <div>
      <header className="pagina-cabecalho">
        <div>
          <h1>Configurações</h1>
          <p className="texto-suave">Os dados da sua empresa aparecem nos seus orçamentos.</p>
        </div>
      </header>

      <div className="coluna-configuracoes">
        <form onSubmit={salvar} className="formulario card secao-form">
          <h2 className="secao-titulo">Dados da empresa</h2>

          {carregando ? (
            <p className="texto-suave">Carregando…</p>
          ) : (
            <>
              <label className="campo">
                <span>Nome da empresa</span>
                <input
                  type="text"
                  value={form.nome_empresa}
                  onChange={(e) => alterar('nome_empresa', e.target.value)}
                />
              </label>

              <div className="linha-campos">
                <label className="campo">
                  <span>Nome do responsável</span>
                  <input
                    type="text"
                    value={form.nome_responsavel}
                    onChange={(e) => alterar('nome_responsavel', e.target.value)}
                  />
                </label>
                <label className="campo">
                  <span>CPF / CNPJ</span>
                  <input
                    type="text"
                    value={form.documento}
                    onChange={(e) => alterar('documento', e.target.value)}
                  />
                </label>
              </div>

              <div className="linha-campos">
                <label className="campo">
                  <span>Telefone</span>
                  <input
                    type="tel"
                    value={form.telefone}
                    onChange={(e) => alterar('telefone', e.target.value)}
                  />
                </label>
                <label className="campo">
                  <span>WhatsApp</span>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={(e) => alterar('whatsapp', e.target.value)}
                  />
                </label>
              </div>

              <label className="campo">
                <span>E-mail de contato</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => alterar('email', e.target.value)}
                />
              </label>

              <label className="campo">
                <span>Endereço</span>
                <input
                  type="text"
                  value={form.endereco}
                  onChange={(e) => alterar('endereco', e.target.value)}
                />
              </label>

              {erro && (
                <div className="aviso aviso-erro" role="alert">
                  {erro}
                </div>
              )}
              {salvo && <div className="aviso aviso-sucesso">Dados salvos com sucesso.</div>}

              <div className="acoes-formulario">
                <button type="submit" className="botao botao-primario" disabled={salvando}>
                  {salvando ? 'Salvando…' : 'Salvar dados'}
                </button>
              </div>
            </>
          )}
        </form>

        <form onSubmit={trocarSenha} className="formulario card secao-form">
          <h2 className="secao-titulo">Conta</h2>
          <p className="texto-suave">
            Você entrou como <strong>{user?.email}</strong>.
          </p>

          <label className="campo">
            <span>Nova senha</span>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
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

          {erroSenha && (
            <div className="aviso aviso-erro" role="alert">
              {erroSenha}
            </div>
          )}
          {senhaAlterada && <div className="aviso aviso-sucesso">Senha alterada com sucesso.</div>}

          <div className="acoes-formulario">
            <button type="submit" className="botao botao-secundario" disabled={salvandoSenha}>
              {salvandoSenha ? 'Salvando…' : 'Alterar senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
