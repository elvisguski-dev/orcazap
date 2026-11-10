import { useEffect, useMemo, useState } from 'react'
import Modal from '../components/Modal'
import ConfirmarExclusao from '../components/ConfirmarExclusao'
import { useLicenca } from '../contexts/LicencaContext'
import { traduzirErro } from '../lib/erros'
import { formatarMoeda, paraNumero, numeroParaCampo } from '../lib/formatar'
import {
  listarServicos,
  criarServico,
  atualizarServico,
  excluirServico,
} from '../services/servicoService'

const FORM_VAZIO = { nome: '', descricao: '', preco: '', ativo: true }

function semAcento(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function ordenar(lista) {
  return [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export default function Servicos() {
  const { bloqueada } = useLicenca()

  const [servicos, setServicos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroLista, setErroLista] = useState('')
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos') // todos | ativos | inativos

  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState('')

  const [excluindo, setExcluindo] = useState(null)
  const [alternando, setAlternando] = useState(null)

  useEffect(() => {
    let ativo = true
    listarServicos()
      .then((dados) => {
        if (ativo) setServicos(dados)
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
    return servicos.filter((s) => {
      if (filtro === 'ativos' && !s.ativo) return false
      if (filtro === 'inativos' && s.ativo) return false
      if (!termo) return true
      return semAcento(`${s.nome} ${s.descricao}`).includes(termo)
    })
  }, [servicos, busca, filtro])

  function abrirNovo() {
    setForm(FORM_VAZIO)
    setErroForm('')
    setEditando('novo')
  }

  function abrirEdicao(servico) {
    setForm({
      nome: servico.nome || '',
      descricao: servico.descricao || '',
      preco: numeroParaCampo(servico.preco),
      ativo: servico.ativo,
    })
    setErroForm('')
    setEditando(servico)
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
      setErroForm('Informe o nome do serviço.')
      return
    }

    const preco = paraNumero(form.preco === '' ? '0' : form.preco)
    if (Number.isNaN(preco) || preco < 0) {
      setErroForm('Informe um preço válido (exemplo: 150,00).')
      return
    }

    setSalvando(true)
    try {
      const dados = { ...form, preco }
      if (editando === 'novo') {
        const criado = await criarServico(dados)
        setServicos((lista) => ordenar([...lista, criado]))
      } else {
        const atualizado = await atualizarServico(editando.id, dados)
        setServicos((lista) =>
          ordenar(lista.map((s) => (s.id === atualizado.id ? atualizado : s)))
        )
      }
      setEditando(null)
    } catch (e) {
      setErroForm(traduzirErro(e))
    } finally {
      setSalvando(false)
    }
  }

  async function alternarAtivo(servico) {
    setAlternando(servico.id)
    setErroLista('')
    try {
      const atualizado = await atualizarServico(servico.id, {
        ...servico,
        ativo: !servico.ativo,
      })
      setServicos((lista) => lista.map((s) => (s.id === atualizado.id ? atualizado : s)))
    } catch (e) {
      setErroLista(traduzirErro(e))
    } finally {
      setAlternando(null)
    }
  }

  async function confirmarExclusao() {
    await excluirServico(excluindo.id)
    setServicos((lista) => lista.filter((s) => s.id !== excluindo.id))
    setExcluindo(null)
  }

  return (
    <div>
      <header className="pagina-cabecalho">
        <div>
          <h1>Serviços</h1>
          <p className="texto-suave">Os serviços e preços que você usa nos orçamentos.</p>
        </div>
        <button type="button" className="botao botao-primario" onClick={abrirNovo} disabled={bloqueada}>
          + Novo serviço
        </button>
      </header>

      <div className="barra-ferramentas">
        <input
          type="search"
          className="campo-busca"
          placeholder="Buscar serviço"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select className="campo-filtro" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="todos">Todos</option>
          <option value="ativos">Só ativos</option>
          <option value="inativos">Só inativos</option>
        </select>
      </div>

      {erroLista && (
        <div className="aviso aviso-erro" role="alert">
          {erroLista}
        </div>
      )}

      {carregando ? (
        <div className="card card-aviso">Carregando serviços…</div>
      ) : filtrados.length === 0 ? (
        <div className="card card-aviso">
          {servicos.length === 0
            ? 'Você ainda não cadastrou nenhum serviço.'
            : 'Nenhum serviço encontrado.'}
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Serviço</th>
                <th>Preço</th>
                <th>Situação</th>
                <th className="coluna-acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((s) => (
                <tr key={s.id} className={s.ativo ? '' : 'linha-inativa'}>
                  <td data-rotulo="Serviço">
                    <strong>{s.nome}</strong>
                    {s.descricao && <div className="texto-suave texto-pequeno">{s.descricao}</div>}
                  </td>
                  <td data-rotulo="Preço">{formatarMoeda(s.preco)}</td>
                  <td data-rotulo="Situação">
                    <span className={`etiqueta ${s.ativo ? 'etiqueta-ativa' : 'etiqueta-inativa'}`}>
                      {s.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="coluna-acoes">
                    <button
                      type="button"
                      className="botao-tabela"
                      onClick={() => alternarAtivo(s)}
                      disabled={bloqueada || alternando === s.id}
                    >
                      {s.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      type="button"
                      className="botao-tabela"
                      onClick={() => abrirEdicao(s)}
                      disabled={bloqueada}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="botao-tabela botao-tabela-perigo"
                      onClick={() => setExcluindo(s)}
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
        <Modal titulo={editando === 'novo' ? 'Novo serviço' : 'Editar serviço'} aoFechar={fecharFormulario}>
          <form onSubmit={salvar} className="formulario">
            <label className="campo">
              <span>Nome do serviço *</span>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => alterarCampo('nome', e.target.value)}
                autoFocus
                required
              />
            </label>

            <label className="campo">
              <span>Preço (R$)</span>
              <input
                type="text"
                inputMode="decimal"
                value={form.preco}
                onChange={(e) => alterarCampo('preco', e.target.value)}
                placeholder="0,00"
              />
            </label>

            <label className="campo">
              <span>Descrição</span>
              <textarea
                rows={3}
                value={form.descricao}
                onChange={(e) => alterarCampo('descricao', e.target.value)}
              />
            </label>

            <label className="campo-checkbox">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => alterarCampo('ativo', e.target.checked)}
              />
              <span>Serviço ativo (disponível para usar nos orçamentos)</span>
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
          titulo="Excluir serviço"
          mensagem={`Tem certeza que deseja excluir "${excluindo.nome}"? Orçamentos antigos que usaram este serviço continuam com os itens. Se preferir apenas esconder o serviço, use "Desativar".`}
          aoConfirmar={confirmarExclusao}
          aoCancelar={() => setExcluindo(null)}
        />
      )}
    </div>
  )
}
