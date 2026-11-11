import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useLicenca } from '../contexts/LicencaContext'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const [menuAberto, setMenuAberto] = useState(false)
  const { bloqueada, mensagemBloqueio } = useLicenca()
  const { session } = useAuth()
  const [iniciandoCheckout, setIniciandoCheckout] = useState(false)
  const [erroCheckout, setErroCheckout] = useState('')

  async function iniciarAssinatura() {
    setIniciandoCheckout(true)
    setErroCheckout('')
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await response.json()
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error || 'Não foi possível iniciar o checkout.')
      window.location.assign(data.checkoutUrl)
    } catch (error) {
      setErroCheckout(error.message || 'Falha ao iniciar o pagamento.')
      setIniciandoCheckout(false)
    }
  }

  return (
    <div className="app">
      <header className="topbar-mobile">
        <button
          type="button"
          className="botao-menu"
          aria-label="Abrir menu"
          onClick={() => setMenuAberto(true)}
        >
          ☰
        </button>
        <span className="logo logo-pequeno">
          Orça<span>Zap</span>
        </span>
      </header>

      {menuAberto && (
        <div className="overlay" onClick={() => setMenuAberto(false)} aria-hidden="true" />
      )}

      <Sidebar aberta={menuAberto} aoNavegar={() => setMenuAberto(false)} />

      <main className="conteudo">
        {bloqueada && (
          <div className="aviso aviso-erro" role="alert">
            <p>
              {mensagemBloqueio} Você ainda pode consultar seus dados, mas não é possível
              criar, alterar ou excluir registros.
            </p>
            <p>Ative o OrçaZap Profissional por R$ 24,90/mês, com cobrança recorrente.</p>
            <button type="button" className="botao botao-primario" onClick={iniciarAssinatura} disabled={iniciandoCheckout}>
              {iniciandoCheckout ? 'Abrindo pagamento…' : 'Assinar com Mercado Pago'}
            </button>
            {erroCheckout && <p role="alert">{erroCheckout}</p>}
          </div>
        )}
        <Outlet />
      </main>
    </div>
  )
}
