import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useLicenca } from '../contexts/LicencaContext'

export default function Layout() {
  const [menuAberto, setMenuAberto] = useState(false)
  const { bloqueada, mensagemBloqueio } = useLicenca()

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
            {mensagemBloqueio} Você ainda pode consultar seus dados, mas não é possível
            criar, alterar ou excluir registros.
          </div>
        )}
        <Outlet />
      </main>
    </div>
  )
}
