import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLicenca } from '../contexts/LicencaContext'
import { traduzirErro } from '../lib/erros'
import { formatarMoeda, numeroParaCampo, paraNumero } from '../lib/formatar'
import { listarClientes } from '../services/clienteService'
import { listarServicos } from '../services/servicoService'
import { buscarOrcamento, salvarOrcamento, STATUS } from '../services/orcamentoService'

let contador = 0
function novoItem(extra = {}) {
  contador += 1
  return { chave: contador, servicoId: '', descricao: '', quantidade: '1', valor: '', ...extra }
}

function subtotalDoItem(item) {
  const q = paraNumero(item.quantidade)
  const v = paraNumero(item.valor)
  if (Number.isNaN(q) || Number.isNaN(v)) return 0
  return q * v
}

export default function OrcamentoForm() {
  const { id } = useParams()
  const editando = Boolean(id)
  const navigate = useNavigate()
  const { bloqueada, limiteAtingido, recarregar } = useLicenca()

  const [clientes, setClientes] = useState([])
  const [servicos, setServicos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarga, setErroCarga] = useState('')

  const [clienteId, setClienteId] = useState('')
  const [cliente, setCliente] = useState('')
  const [telefone, setTelefone] = useState('')
  const [validade, setValidade] = useState('')
  const [status, setStatus] = useState('Pendente')
  const [observacoes, setObservacoes] = useState('')
  const [itens, setItens] = useState(() => [novoItem()])

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    Promise.all([listarClientes(), listarServicos(), editando ? buscarOrcamento(id) : null])
      .then(([listaClientes, listaServicos, orcamento]) => {
        if (!ativo) return
        setClientes(listaClientes)
        setServicos(listaServicos)

        if (editando) {
          if (!orcamento) {
            setErroCarga('Orçamento não encontrado.')
            return
          }
          setClienteId(orcamento.cliente_id ? String(orcamento.cliente_id) : '')
          setCliente(orcamento.cliente || '')
          setTelefone(orcamento.telefone || '')
          setValidade(orcamento.validade || '')
          setStatus(orcamento.status || 'Pendente')
          setObservacoes(orcamento.observacoes || '')
          setItens(
            orcamento.itens.length > 0
              ? orcamento.itens.map((i) =>
                  novoItem({
                    servicoId: i.servico_id ? String(i.servico_id) : '',
                    descricao: i.descricao || '',
                    quantidade: String(i.quantidade).replace('.', ','),
                    valor: numeroParaCampo(i.valor_unitario),
                  })
                )
              : [novoItem()]
          )
        }
      })
      .catch((e) => {
        if (ativo) setErroCarga(traduzirErro(e))
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [id, editando])

  const total = useMemo(() => itens.reduce((soma, i) => soma + subtotalDoItem(i), 0), [itens])

  function escolherCliente(valor) {
    setClienteId(valor)
    if (valor === '') return
    const escolhido = clientes.find((c) => String(c.id) === valor)
    if (escolhido) {
      setCliente(escolhido.nome)
      setTelefone(escolhido.telefone || '')
    }
  }

  function digitarNomeCliente(valor) {
    setCliente(valor)
    // Se o nome foi mudado à mão, deixa de estar ligado ao cadastro.
    setClienteId('')
  }

  function alterarItem(chave, campo, valor) {
    setItens((lista) => lista.map((i) => (i.chave === chave ? { ...i, [campo]: valor } : i)))
  }

  function escolherServico(chave, valor) {
    const servico = servicos.find((s) => String(s.id) === valor)
    setItens((lista) =>
      lista.map((i) => {
        if (i.chave !== chave) return i
        if (!servico) return { ...i, servicoId: '' }
        return {
          ...i,
          servicoId: valor,
          descricao: servico.nome,
          valor: numeroParaCampo(servico.preco),
        }
      })
    )
  }

  function adicionarItem() {
    setItens((lista) => [...lista, novoItem()])
  }

  function removerItem(chave) {
    setItens((lista) => (lista.length === 1 ? [novoItem()] : lista.filter((i) => i.chave !== chave)))
  }

  async function salvar(evento) {
    evento.preventDefault()
    setErro('')

    if (!cliente.trim()) {
      setErro('Informe o cliente.')
      return
    }

    // Linhas totalmente em branco são ignoradas.
    const preenchidos = itens.filter((i) => i.descricao.trim() !== '' || i.valor.trim() !== '')
    if (preenchidos.length === 0) {
      setErro('Adicione pelo menos um item ao orçamento.')
      return
    }

    const itensParaSalvar = []
    for (const [posicao, item] of preenchidos.entries()) {
      const numero = posicao + 1
      const quantidade = paraNumero(item.quantidade)
      const valorUnitario = paraNumero(item.valor === '' ? '0' : item.valor)

      if (!item.descricao.trim()) {
        setErro(`Item ${numero}: informe a descrição.`)
        return
      }
      if (Number.isNaN(quantidade) || quantidade <= 0) {
        setErro(`Item ${numero}: a quantidade deve ser maior que zero.`)
        return
      }
      if (Number.isNaN(valorUnitario) || valorUnitario < 0) {
        setErro(`Item ${numero}: informe um valor válido (exemplo: 150,00).`)
        return
      }

      itensParaSalvar.push({
        servicoId: item.servicoId ? Number(item.servicoId) : null,
        descricao: item.descricao.trim(),
        quantidade,
        valorUnitario,
      })
    }

    setSalvando(true)
    try {
      const novoId = await salvarOrcamento({
        id: editando ? Number(id) : null,
        clienteId: clienteId ? Number(clienteId) : null,
        cliente: cliente.trim(),
        telefone: telefone.trim(),
        validade,
        observacoes: observacoes.trim(),
        status,
        itens: itensParaSalvar,
      })
      await recarregar() // atualiza o contador de uso do plano
      navigate(`/orcamentos/${novoId}`)
    } catch (e) {
      setErro(traduzirErro(e))
      setSalvando(false)
    }
  }

  const naoPodeSalvar = bloqueada || (!editando && limiteAtingido)

  if (carregando) {
    return <div className="card card-aviso">Carregando…</div>
  }

  if (erroCarga) {
    return (
      <div>
        <div className="aviso aviso-erro" role="alert">
          {erroCarga}
        </div>
        <p style={{ marginTop: 16 }}>
          <Link to="/orcamentos" className="botao-link">
            ← Voltar para os orçamentos
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div>
      <header className="pagina-cabecalho">
        <div>
          <Link to={editando ? `/orcamentos/${id}` : '/orcamentos'} className="botao-link">
            ← Voltar
          </Link>
          <h1 style={{ marginTop: 8 }}>{editando ? `Editar orçamento #${id}` : 'Novo orçamento'}</h1>
        </div>
      </header>

      {!editando && limiteAtingido && !bloqueada && (
        <div className="aviso aviso-erro" role="alert" style={{ marginBottom: 20 }}>
          Você atingiu o limite mensal de orçamentos do seu plano.
        </div>
      )}

      <form onSubmit={salvar} className="formulario">
        <section className="card secao-form">
          <h2 className="secao-titulo">Cliente</h2>

          <label className="campo">
            <span>Cliente cadastrado</span>
            <select
              className="campo-filtro"
              value={clienteId}
              onChange={(e) => escolherCliente(e.target.value)}
            >
              <option value="">— Digitar manualmente —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>

          <div className="linha-campos">
            <label className="campo">
              <span>Nome do cliente *</span>
              <input
                type="text"
                value={cliente}
                onChange={(e) => digitarNomeCliente(e.target.value)}
                required
              />
            </label>
            <label className="campo">
              <span>Telefone / WhatsApp</span>
              <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </label>
          </div>

          <div className="linha-campos">
            <label className="campo">
              <span>Válido até</span>
              <input type="date" value={validade} onChange={(e) => setValidade(e.target.value)} />
            </label>
            <label className="campo">
              <span>Status</span>
              <select
                className="campo-filtro"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="card secao-form">
          <h2 className="secao-titulo">Itens</h2>

          <div className="itens-cabecalho">
            <span>Serviço</span>
            <span>Descrição</span>
            <span>Qtd.</span>
            <span>Valor unit. (R$)</span>
            <span>Subtotal</span>
            <span />
          </div>

          {itens.map((item) => (
            <div className="item-linha" key={item.chave}>
              <select
                className="campo-filtro"
                value={item.servicoId}
                onChange={(e) => escolherServico(item.chave, e.target.value)}
                aria-label="Serviço"
              >
                <option value="">Item avulso</option>
                {servicos.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                    {s.ativo ? '' : ' (inativo)'}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={item.descricao}
                onChange={(e) => alterarItem(item.chave, 'descricao', e.target.value)}
                placeholder="Descrição do item"
                aria-label="Descrição"
              />

              <input
                type="text"
                inputMode="decimal"
                value={item.quantidade}
                onChange={(e) => alterarItem(item.chave, 'quantidade', e.target.value)}
                aria-label="Quantidade"
              />

              <input
                type="text"
                inputMode="decimal"
                value={item.valor}
                onChange={(e) => alterarItem(item.chave, 'valor', e.target.value)}
                placeholder="0,00"
                aria-label="Valor unitário"
              />

              <span className="item-subtotal">{formatarMoeda(subtotalDoItem(item))}</span>

              <button
                type="button"
                className="botao-tabela botao-tabela-perigo"
                onClick={() => removerItem(item.chave)}
                aria-label="Remover item"
              >
                Remover
              </button>
            </div>
          ))}

          <div className="itens-rodape">
            <button type="button" className="botao botao-secundario" onClick={adicionarItem}>
              + Adicionar item
            </button>
            <div className="total-orcamento">
              Total: <strong>{formatarMoeda(total)}</strong>
            </div>
          </div>
        </section>

        <section className="card secao-form">
          <label className="campo">
            <span>Observações</span>
            <textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Condições de pagamento, prazo de entrega…"
            />
          </label>
        </section>

        {erro && (
          <div className="aviso aviso-erro" role="alert">
            {erro}
          </div>
        )}

        <div className="acoes-formulario">
          <Link
            to={editando ? `/orcamentos/${id}` : '/orcamentos'}
            className="botao botao-secundario botao-link-bloco"
          >
            Cancelar
          </Link>
          <button type="submit" className="botao botao-primario" disabled={salvando || naoPodeSalvar}>
            {salvando ? 'Salvando…' : 'Salvar orçamento'}
          </button>
        </div>
      </form>
    </div>
  )
}
