import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLicenca } from '../contexts/LicencaContext'
import { traduzirErro } from '../lib/erros'
import { formatarData, formatarMoeda } from '../lib/formatar'
import { calcularResumo } from '../lib/resumo'
import { buscarPerfil } from '../services/perfilService'
import { listarOrcamentos } from '../services/orcamentoService'
import { EtiquetaStatus } from './Orcamentos'

function capitalizar(texto) {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : ''
}

export default function Dashboard() {
  const { user } = useAuth()
  const { resumo: uso, carregando: carregandoPlano, nomePlano, ilimitado } = useLicenca()

  const [perfil, setPerfil] = useState(null)
  const [orcamentos, setOrcamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    buscarPerfil()
      .then((dados) => {
        if (ativo) setPerfil(dados)
      })
      .catch(() => {})

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

  const numeros = useMemo(() => calcularResumo(orcamentos), [orcamentos])
  const recentes = orcamentos.slice(0, 5)

  const primeiroNome =
    perfil?.nome_responsavel?.trim().split(' ')[0] ||
    capitalizar(user?.email?.split('@')[0] || '')

  const mostrar = (valor) => (carregando ? '…' : valor)

  return (
    <div>
      <header className="pagina-cabecalho">
        <div>
          <h1>Olá, {primeiroNome} 👋</h1>
          <p className="texto-suave">Veja um resumo do seu negócio.</p>
        </div>
        <Link to="/orcamentos/novo" className="botao botao-primario botao-link-bloco">
          + Novo orçamento
        </Link>
      </header>

      {erro && (
        <div className="aviso aviso-erro" role="alert" style={{ marginBottom: 20 }}>
          {erro}
        </div>
      )}

      <div className="grade-cards grade-cards-4">
        <div className="card">
          <span className="card-rotulo">Orçamentos</span>
          <strong className="card-valor">{mostrar(numeros.total)}</strong>
          <span className="card-nota">{mostrar(formatarMoeda(numeros.valorTotal))} no total</span>
        </div>

        <div className="card">
          <span className="card-rotulo">Pendentes</span>
          <strong className="card-valor">{mostrar(numeros.Pendente.qtd)}</strong>
          <span className="card-nota">{mostrar(formatarMoeda(numeros.Pendente.valor))} aguardando</span>
        </div>

        <div className="card">
          <span className="card-rotulo">Aprovados</span>
          <strong className="card-valor">{mostrar(numeros.Aprovado.qtd)}</strong>
          <span className="card-nota">
            {mostrar(formatarMoeda(numeros.Aprovado.valor))} · {numeros.taxaAprovacao}% do total
          </span>
        </div>

        <div className="card">
          <span className="card-rotulo">Recusados</span>
          <strong className="card-valor">{mostrar(numeros.Recusado.qtd)}</strong>
          <span className="card-nota">{mostrar(formatarMoeda(numeros.Recusado.valor))}</span>
        </div>
      </div>

      <h2 className="secao-titulo">Este mês</h2>
      <div className="grade-cards">
        <div className="card">
          <span className="card-rotulo">Orçamentos criados</span>
          <strong className="card-valor">{mostrar(numeros.criadosNoMes)}</strong>
          <span className="card-nota">
            {carregandoPlano
              ? '…'
              : ilimitado
                ? 'Sem limite mensal'
                : `Restam ${uso?.restantes ?? 0} de ${uso?.limite_mensal ?? '—'}`}
          </span>
        </div>

        <div className="card">
          <span className="card-rotulo">Aprovado no mês</span>
          <strong className="card-valor">{mostrar(formatarMoeda(numeros.aprovadoNoMes))}</strong>
          <span className="card-nota">Orçamentos criados e aprovados neste mês</span>
        </div>

        <div className="card">
          <span className="card-rotulo">Plano atual</span>
          <strong className="card-valor">{carregandoPlano ? '…' : nomePlano}</strong>
          <span className="card-nota">
            {uso?.expira_em ? `Expira em ${formatarData(uso.expira_em)}` : 'Licença vitalícia'}
          </span>
        </div>
      </div>

      <h2 className="secao-titulo">Últimos orçamentos</h2>
      {carregando ? (
        <div className="card card-aviso">Carregando…</div>
      ) : recentes.length === 0 ? (
        <div className="card card-aviso">
          Você ainda não criou nenhum orçamento.{' '}
          <Link to="/orcamentos/novo" className="botao-link">
            Criar o primeiro
          </Link>
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Valor</th>
                <th>Status</th>
                <th className="coluna-acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              {recentes.map((o) => (
                <tr key={o.id}>
                  <td data-rotulo="Nº">#{o.id}</td>
                  <td data-rotulo="Cliente">
                    <strong>{o.cliente}</strong>
                  </td>
                  <td data-rotulo="Data">{formatarData(o.created_at)}</td>
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
      )}
    </div>
  )
}
