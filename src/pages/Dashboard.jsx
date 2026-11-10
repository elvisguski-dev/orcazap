import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLicenca } from '../contexts/LicencaContext'
import { buscarPerfil } from '../services/perfilService'

function capitalizar(texto) {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : ''
}

export default function Dashboard() {
  const { user } = useAuth()
  const { resumo, carregando, nomePlano, ilimitado } = useLicenca()
  const [perfil, setPerfil] = useState(null)

  useEffect(() => {
    let ativo = true
    buscarPerfil()
      .then((dados) => {
        if (ativo) setPerfil(dados)
      })
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [])

  const primeiroNome =
    perfil?.nome_responsavel?.trim().split(' ')[0] ||
    capitalizar(user?.email?.split('@')[0] || '')

  return (
    <div>
      <header className="pagina-cabecalho">
        <div>
          <h1>Olá, {primeiroNome} 👋</h1>
          <p className="texto-suave">Veja um resumo do seu negócio.</p>
        </div>
      </header>

      <div className="grade-cards">
        <div className="card">
          <span className="card-rotulo">Plano atual</span>
          <strong className="card-valor">{carregando ? '…' : nomePlano}</strong>
          <span className="card-nota">
            {resumo?.expira_em ? 'Com data de validade' : 'Licença vitalícia'}
          </span>
        </div>

        <div className="card">
          <span className="card-rotulo">Orçamentos no mês</span>
          <strong className="card-valor">{carregando ? '…' : (resumo?.usados_no_mes ?? 0)}</strong>
          <span className="card-nota">
            {ilimitado ? 'Sem limite mensal' : `Limite: ${resumo?.limite_mensal ?? '—'}`}
          </span>
        </div>

        <div className="card">
          <span className="card-rotulo">Restantes no mês</span>
          <strong className="card-valor">
            {carregando ? '…' : ilimitado ? 'Ilimitado' : (resumo?.restantes ?? 0)}
          </strong>
          <span className="card-nota">Conta a partir do dia 1º</span>
        </div>
      </div>

      <div className="card card-aviso">
        Os totais de orçamentos, aprovados e pendentes aparecem aqui quando o módulo de
        Orçamentos for construído.
      </div>
    </div>
  )
}
