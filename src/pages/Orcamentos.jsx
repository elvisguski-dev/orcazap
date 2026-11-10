import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLicenca } from '../contexts/LicencaContext'
import { traduzirErro } from '../lib/erros'
import { formatarData, formatarMoeda } from '../lib/formatar'
import { listarOrcamentos, STATUS } from '../services/orcamentoService'

function semAcento(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function EtiquetaStatus({ status }) {
  const classe = `etiqueta etiqueta-${semAcento(status || 'pendente')}`
  return <span className={classe}>{status || 'Pendente'}</span>
}

export default function Orcamentos() {
  const { bloqueada, limiteAtingido, podeCriarOrcamento } = useLicenca()

  const [orcamentos, setOrcamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    let ativo = true
    listarOrcamentos()
      .then((dados) => {
        if (ativo) setOrcamentos(dados)
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

  const filtrados = useMemo(() => {
    const termo = semAcento(busca.trim())
    return orcamentos.filter((o) => {
      if (filtro !== 'todos' && o.status !== filtro) return false
      if (!termo) return true
      return semAcento(`${o.cliente} ${o.descricao} ${o.id}`).includes(termo)
    })
  }, [orcamentos, busca, filtro])

  const totalFiltrado = filtrados.reduce((soma, o) => soma + o.valor, 0)

  return (
    <div>
      <header className="pagina-cabecalho">
        <div>
          <h1>Orçamentos</h1>
          <p className="texto-suave">Crie, acompanhe e aprove os seus orçamentos.</p>
        </div>
        {podeCriarOrcamento ? (
          <Link to="/orcamentos/novo" className="botao botao-primario botao-link-bloco">
            + Novo orçamento
          </Link>
        ) : (
          <button type="button" className="botao botao-primario" disabled>
            + Novo orçamento
          </button>
        )}
      </header>

      {limiteAtingido && !bloqueada && (
        <div className="aviso aviso-erro" role="alert">
          Você atingiu o limite mensal de orçamentos do seu plano. Novos orçamentos ficam
          disponíveis no próximo mês ou ao mudar de plano. Os existentes continuam acessíveis.
        </div>
      )}

      <div className="barra-ferramentas">
        <input
          type="search"
          className="campo-busca"
          placeholder="Buscar por cliente, serviço ou número"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select className="campo-filtro" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="todos">Todos os status</option>
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {erro && (
        <div className="aviso aviso-erro" role="alert">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="card card-aviso">Carregando orçamentos…</div>
      ) : filtrados.length === 0 ? (
        <div className="card card-aviso">
          {orcamentos.length === 0
            ? 'Você ainda não criou nenhum orçamento.'
            : 'Nenhum orçamento encontrado.'}
        </div>
      ) : (
        <>
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Cliente</th>
                  <th>Data</th>
                  <th>Validade</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th className="coluna-acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((o) => (
                  <tr key={o.id}>
                    <td data-rotulo="Nº">#{o.id}</td>
                    <td data-rotulo="Cliente">
                      <strong>{o.cliente}</strong>
                      {o.descricao && (
                        <div className="texto-suave texto-pequeno texto-cortado">{o.descricao}</div>
                      )}
                    </td>
                    <td data-rotulo="Data">{formatarData(o.created_at)}</td>
                    <td data-rotulo="Validade">{formatarData(o.validade)}</td>
                    <td data-rotulo="Valor">{formatarMoeda(o.valor)}</td>
                    <td data-rotulo="Status">
                      <EtiquetaStatus status={o.status} />
                    </td>
                    <td className="coluna-acoes">
                      <Link to={`/orcamentos/${o.id}`} className="botao-tabela">
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="texto-suave rodape-lista">
            {filtrados.length} {filtrados.length === 1 ? 'orçamento' : 'orçamentos'} · total{' '}
            {formatarMoeda(totalFiltrado)}
          </p>
        </>
      )}
    </div>
  )
}
