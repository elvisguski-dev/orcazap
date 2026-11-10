import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLicenca } from '../contexts/LicencaContext'

const ITENS_MENU = [
  { para: '/', rotulo: 'Dashboard', fim: true },
  { para: '/clientes', rotulo: 'Clientes' },
  { para: '/orcamentos', rotulo: 'Orçamentos' },
  { para: '/servicos', rotulo: 'Serviços' },
  { para: '/configuracoes', rotulo: 'Configurações' },
]

function formatarData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function CartaoPlano() {
  const {
    resumo,
    carregando,
    erro,
    nomePlano,
    bloqueada,
    mensagemBloqueio,
    ilimitado,
    limiteAtingido,
  } = useLicenca()

  if (carregando) {
    return (
      <div className="plano-card">
        <span className="plano-rotulo">Carregando plano…</span>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="plano-card plano-card-alerta">
        <span className="plano-rotulo">Plano indisponível</span>
        <span className="plano-detalhe">Não foi possível carregar sua licença.</span>
      </div>
    )
  }

  if (bloqueada) {
    return (
      <div className="plano-card plano-card-alerta">
        <span className="plano-rotulo">Licença bloqueada</span>
        <span className="plano-detalhe">{mensagemBloqueio}</span>
      </div>
    )
  }

  const porcentagem = ilimitado
    ? 0
    : Math.min(100, Math.round((resumo.usados_no_mes / resumo.limite_mensal) * 100))
  const quaseNoLimite = !ilimitado && porcentagem >= 90

  return (
    <div className={`plano-card ${limiteAtingido ? 'plano-card-alerta' : ''}`}>
      <span className="plano-rotulo">Plano</span>
      <strong className="plano-nome">{nomePlano}</strong>

      {ilimitado ? (
        <span className="plano-detalhe">
          {resumo.usados_no_mes} orçamentos este mês · ilimitado
        </span>
      ) : (
        <>
          <div className="plano-barra" aria-hidden="true">
            <div
              className={`plano-barra-preenchida ${quaseNoLimite ? 'cheia' : ''}`}
              style={{ width: `${porcentagem}%` }}
            />
          </div>
          <span className="plano-detalhe">
            {resumo.usados_no_mes} de {resumo.limite_mensal} orçamentos no mês
          </span>
          {limiteAtingido && (
            <span className="plano-detalhe plano-destaque">Limite mensal atingido</span>
          )}
        </>
      )}

      <span className="plano-detalhe">
        {resumo.expira_em ? `Expira em ${formatarData(resumo.expira_em)}` : 'Licença vitalícia'}
      </span>
    </div>
  )
}

export default function Sidebar({ aberta, aoNavegar }) {
  const { user, ehAdmin, signOut } = useAuth()

  const itens = ehAdmin
    ? [...ITENS_MENU, { para: '/admin', rotulo: 'Administração' }]
    : ITENS_MENU

  return (
    <aside className={`sidebar ${aberta ? 'aberta' : ''}`}>
      <div className="logo">
        Orça<span>Zap</span>
      </div>

      <nav className="menu">
        {itens.map((item) => (
          <NavLink
            key={item.para}
            to={item.para}
            end={item.fim}
            onClick={aoNavegar}
            className={({ isActive }) => `menu-link ${isActive ? 'ativo' : ''}`}
          >
            {item.rotulo}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-rodape">
        <CartaoPlano />
        <div className="usuario">
          <span className="usuario-email" title={user?.email}>
            {user?.email}
          </span>
          <button type="button" className="botao-sair" onClick={signOut}>
            Sair
          </button>
        </div>
      </div>
    </aside>
  )
}
