import { useEffect, useMemo, useState } from 'react'
import Modal from '../components/Modal'
import ConfirmarExclusao from '../components/ConfirmarExclusao'
import { useLicenca } from '../contexts/LicencaContext'
import { traduzirErro } from '../lib/erros'
import {
  listarClientes,
  criarCliente,
  atualizarCliente,
  excluirCliente,
} from '../services/clienteService'

const FORM_VAZIO = {
  nome: '',
  telefone: '',
  email: '',
  documento: '',
  endereco: '',
  observacoes: '',
}

function semAcento(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export default function Clientes() {
  const { bloqueada } = useLicenca()

  const [clientes, setClientes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroLista, setErroLista] = useState('')
  const [busca, setBusca] = useState('')

  // null = fechado, 'novo' = cadastrando, objeto = editando aquele cliente
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState('')

  const [excluindo, setExcluindo] = useState(null)

  useEffect(() => {
    let ativo = true
    listarClientes()
      .then((dados) => {
        if (ativo) setClientes(dados)
      })
      .catch((e) => {
        if (ativo) setErroLista(traduzirErro(e))
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  const filtrados = useMemo(() => {
    const termo = semAcento(busca.trim())
    if (!termo) return clientes
    return clientes.filter((c) =>
      semAcento(`${c.nome} ${c.telefone} ${c.email} ${c.documento}`).includes(termo)
    )
  }, [clientes, busca])

  function abrirNovo() {
    setForm(FORM_VAZIO)
    setErroForm('')
    setEditando('novo')
  }

  function abrirEdicao(cliente) {
    setForm({
      nome: cliente.nome || '',
      telefone: cliente.telefone || '',
      email: cliente.email || '',
      documento: cliente.documento || '',
      endereco: cliente.endereco || '',
      observacoes: cliente.observacoes || '',
    })
    setErroForm('')
    setEditando(cliente)
  }

  function fecharFormulario() {
    if (!salvando) setEditando(null)
  }

  function alterarCampo(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  async function salvar(evento) {
    evento.preventDefault()
    setErroForm('')

    if (!form.nome.trim()) {
      setErroForm('Informe o nome do cliente.')
      return
    }

    setSalvando(true)
    try {
      if (editando === 'novo') {
        const criado = await criarCliente(form)
        setClientes((lista) =>
          [...lista, criado].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        )
      } else {
        const atualizado = await atualizarCliente(editando.id, form)
        setClientes((lista) =>
          lista
            .map((c) => (c.id === atualizado.id ? atualizado : c))
            .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        )
      }
      setEditando(null)
    } catch (e) {
      setErroForm(traduzirErro(e))
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarExclusao() {
    await excluirCliente(excluindo.id)
    setClientes((lista) => lista.filter((c) => c.id !== excluindo.id))
    setExcluindo(null)
  }

  return (
    <div>
      <header className="pagina-cabecalho">
        <div>
          <h1>Clientes</h1>
          <p className="texto-suave">Cadastre e gerencie os seus clientes.</p>
        </div>
        <button type="button" className="botao botao-primario" onClick={abrirNovo} disabled={bloqueada}>
          + Novo cliente
        </button>
      </header>

      <div className="barra-ferramentas">
        <input
          type="search"
          className="campo-busca"
          placeholder="Buscar por nome, telefone, e-mail ou documento"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <span className="texto-suave">
          {filtrados.length} {filtrados.length === 1 ? 'cliente' : 'clientes'}
        </span>
      </div>

      {erroLista && (
        <div className="aviso aviso-erro" role="alert">
          {erroLista}
        </div>
      )}

      {carregando ? (
        <div className="card card-aviso">Carregando clientes…</div>
      ) : filtrados.length === 0 ? (
        <div className="card card-aviso">
          {clientes.length === 0
            ? 'Você ainda não cadastrou nenhum cliente.'
            : 'Nenhum cliente encontrado para essa busca.'}
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Documento</th>
                <th className="coluna-acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id}>
                  <td data-rotulo="Nome">
                    <strong>{c.nome}</strong>
                  </td>
                  <td data-rotulo="Telefone">{c.telefone || '—'}</td>
                  <td data-rotulo="E-mail">{c.email || '—'}</td>
                  <td data-rotulo="Documento">{c.documento || '—'}</td>
                  <td className="coluna-acoes">
                    <button
                      type="button"
                      className="botao-tabela"
                      onClick={() => abrirEdicao(c)}
                      disabled={bloqueada}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="botao-tabela botao-tabela-perigo"
                      onClick={() => setExcluindo(c)}
                      disabled={bloqueada}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <Modal titulo={editando === 'novo' ? 'Novo cliente' : 'Editar cliente'} aoFechar={fecharFormulario}>
          <form onSubmit={salvar} className="formulario">
            <label className="campo">
              <span>Nome *</span>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => alterarCampo('nome', e.target.value)}
                autoFocus
                required
              />
            </label>

            <div className="linha-campos">
              <label className="campo">
                <span>Telefone / WhatsApp</span>
                <input
                  type="tel"
                  value={form.telefone}
                  onChange={(e) => alterarCampo('telefone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </label>
              <label className="campo">
                <span>E-mail</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => alterarCampo('email', e.target.value)}
                />
              </label>
            </div>

            <label className="campo">
              <span>CPF / CNPJ</span>
              <input
                type="text"
                value={form.documento}
                onChange={(e) => alterarCampo('documento', e.target.value)}
              />
            </label>

            <label className="campo">
              <span>Endereço</span>
              <input
                type="text"
                value={form.endereco}
                onChange={(e) => alterarCampo('endereco', e.target.value)}
              />
            </label>

            <label className="campo">
              <span>Observações</span>
              <textarea
                rows={3}
                value={form.observacoes}
                onChange={(e) => alterarCampo('observacoes', e.target.value)}
              />
            </label>

            {erroForm && (
              <div className="aviso aviso-erro" role="alert">
                {erroForm}
              </div>
            )}

            <div className="acoes-formulario">
              <button type="button" className="botao botao-secundario" onClick={fecharFormulario} disabled={salvando}>
                Cancelar
              </button>
              <button type="submit" className="botao botao-primario" disabled={salvando}>
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {excluindo && (
        <ConfirmarExclusao
          titulo="Excluir cliente"
          mensagem={`Tem certeza que deseja excluir "${excluindo.nome}"? Os orçamentos já criados para este cliente continuam existindo, mas ficam sem vínculo com o cadastro.`}
          aoConfirmar={confirmarExclusao}
          aoCancelar={() => setExcluindo(null)}
        />
      )}
    </div>
  )
}
