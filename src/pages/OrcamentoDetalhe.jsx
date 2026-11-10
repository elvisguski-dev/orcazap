import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ConfirmarExclusao from '../components/ConfirmarExclusao'
import { useLicenca } from '../contexts/LicencaContext'
import { traduzirErro } from '../lib/erros'
import { formatarData, formatarMoeda } from '../lib/formatar'
import { baixarPdfOrcamento } from '../lib/pdf'
import { linkWhatsapp } from '../lib/whatsapp'
import { buscarPerfil } from '../services/perfilService'
import {
  atualizarStatus,
  buscarOrcamento,
  excluirOrcamento,
  STATUS,
} from '../services/orcamentoService'
import { EtiquetaStatus } from './Orcamentos'

export default function OrcamentoDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { bloqueada, recarregar } = useLicenca()

  const [orcamento, setOrcamento] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mudandoStatus, setMudandoStatus] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [perfil, setPerfil] = useState(null)
  const [gerandoPdf, setGerandoPdf] = useState(false)

  useEffect(() => {
    let ativo = true
    buscarPerfil()
      .then((dados) => {
        if (ativo) setPerfil(dados)
      })
      .catch(() => {})
    buscarOrcamento(id)
      .then((dados) => {
        if (!ativo) return
        if (!dados) setErro('Orçamento não encontrado.')
        else setOrcamento(dados)
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
  }, [id])

  async function mudarStatus(novoStatus) {
    if (novoStatus === orcamento.status) return
    setMudandoStatus(true)
    setErro('')
    try {
      const atualizado = await atualizarStatus(orcamento.id, novoStatus)
      setOrcamento((atual) => ({ ...atual, status: atualizado.status }))
    } catch (e) {
      setErro(traduzirErro(e))
    } finally {
      setMudandoStatus(false)
    }
  }

  async function baixarPdf() {
    setGerandoPdf(true)
    setErro('')
    try {
      await baixarPdfOrcamento(orcamento, perfil)
    } catch (e) {
      console.error(e)
      setErro('Não foi possível gerar o PDF. Tente novamente.')
    } finally {
      setGerandoPdf(false)
    }
  }

  function enviarWhatsapp() {
    window.open(linkWhatsapp(orcamento, perfil), '_blank', 'noopener,noreferrer')
  }

  async function confirmarExclusao() {
    await excluirOrcamento(orcamento.id)
    await recarregar()
    navigate('/orcamentos')
  }

  if (carregando) return <div className="card card-aviso">Carregando…</div>

  if (!orcamento) {
    return (
      <div>
        <div className="aviso aviso-erro" role="alert">
          {erro || 'Orçamento não encontrado.'}
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
          <Link to="/orcamentos" className="botao-link">
            ← Orçamentos
          </Link>
          <h1 style={{ marginTop: 8 }}>Orçamento #{orcamento.id}</h1>
          <p className="texto-suave">Criado em {formatarData(orcamento.created_at)}</p>
        </div>

        <div className="acoes-cabecalho">
          <button type="button" className="botao botao-secundario" onClick={baixarPdf} disabled={gerandoPdf}>
            {gerandoPdf ? 'Gerando…' : 'Baixar PDF'}
          </button>
          <button type="button" className="botao botao-whatsapp" onClick={enviarWhatsapp}>
            WhatsApp
          </button>
          {bloqueada ? (
            <button type="button" className="botao botao-secundario" disabled>
              Editar
            </button>
          ) : (
            <Link to={`/orcamentos/${orcamento.id}/editar`} className="botao botao-secundario botao-link-bloco">
              Editar
            </Link>
          )}
          <button
            type="button"
            className="botao botao-perigo"
            onClick={() => setConfirmandoExclusao(true)}
            disabled={bloqueada}
          >
            Excluir
          </button>
        </div>
      </header>

      {erro && (
        <div className="aviso aviso-erro" role="alert" style={{ marginBottom: 20 }}>
          {erro}
        </div>
      )}

      <div className="grade-cards">
        <div className="card">
          <span className="card-rotulo">Cliente</span>
          <strong className="card-valor card-valor-texto">{orcamento.cliente}</strong>
          <span className="card-nota">{orcamento.telefone || 'Sem telefone'}</span>
        </div>

        <div className="card">
          <span className="card-rotulo">Valor total</span>
          <strong className="card-valor">{formatarMoeda(orcamento.valor)}</strong>
          <span className="card-nota">Válido até {formatarData(orcamento.validade)}</span>
        </div>

        <div className="card">
          <span className="card-rotulo">Status</span>
          <div>
            <EtiquetaStatus status={orcamento.status} />
          </div>
          <select
            className="campo-filtro"
            value={orcamento.status || 'Pendente'}
            onChange={(e) => mudarStatus(e.target.value)}
            disabled={bloqueada || mudandoStatus}
            aria-label="Mudar status"
          >
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <h2 className="secao-titulo">Itens</h2>
      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Qtd.</th>
              <th>Valor unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {orcamento.itens.map((item) => (
              <tr key={item.id}>
                <td data-rotulo="Descrição">{item.descricao}</td>
                <td data-rotulo="Qtd.">{String(item.quantidade).replace('.', ',')}</td>
                <td data-rotulo="Valor unit.">{formatarMoeda(item.valor_unitario)}</td>
                <td data-rotulo="Subtotal">{formatarMoeda(item.quantidade * item.valor_unitario)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="total-rotulo">
                Total
              </td>
              <td className="total-valor">{formatarMoeda(orcamento.valor)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {orcamento.observacoes && (
        <>
          <h2 className="secao-titulo">Observações</h2>
          <div className="card card-observacoes">{orcamento.observacoes}</div>
        </>
      )}

      {confirmandoExclusao && (
        <ConfirmarExclusao
          titulo="Excluir orçamento"
          mensagem={`Tem certeza que deseja excluir o orçamento #${orcamento.id} de "${orcamento.cliente}"? Esta ação não pode ser desfeita.`}
          aoConfirmar={confirmarExclusao}
          aoCancelar={() => setConfirmandoExclusao(false)}
        />
      )}
    </div>
  )
}
