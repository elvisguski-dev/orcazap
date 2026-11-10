import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { configuracaoOk } from './lib/supabase'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LicencaProvider } from './contexts/LicencaContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Servicos from './pages/Servicos'
import Placeholder from './pages/Placeholder'

function TelaCentral({ children }) {
  return (
    <div className="auth-tela">
      <div className="auth-card">{children}</div>
    </div>
  )
}

function ConfiguracaoFaltando() {
  return (
    <TelaCentral>
      <div className="logo logo-centro">
        Orça<span>Zap</span>
      </div>
      <h1 className="auth-titulo">Falta configurar o Supabase</h1>
      <p className="auth-subtitulo">
        Crie o arquivo <code>.env.local</code> na raiz do projeto com as duas linhas abaixo e
        reinicie o <code>npm run dev</code>:
      </p>
      <pre className="bloco-codigo">
        {`VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co\nVITE_SUPABASE_ANON_KEY=sua-chave-anon-ou-publishable`}
      </pre>
    </TelaCentral>
  )
}

function Rotas() {
  const { session, carregando, recuperandoSenha, ehAdmin } = useAuth()

  if (carregando) {
    return (
      <TelaCentral>
        <p className="auth-subtitulo">Carregando…</p>
      </TelaCentral>
    )
  }

  if (recuperandoSenha) return <ResetPassword />
  if (!session) return <Login />

  return (
    <LicencaProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="orcamentos" element={<Placeholder titulo="Orçamentos" />} />
          <Route path="servicos" element={<Servicos />} />
          <Route path="configuracoes" element={<Placeholder titulo="Configurações" />} />
          <Route
            path="admin"
            element={
              ehAdmin === null ? (
                <p className="texto-suave">Verificando permissão…</p>
              ) : ehAdmin ? (
                <Placeholder titulo="Administração" />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LicencaProvider>
  )
}

export default function App() {
  if (!configuracaoOk) return <ConfiguracaoFaltando />

  return (
    <BrowserRouter>
      <AuthProvider>
        <Rotas />
      </AuthProvider>
    </BrowserRouter>
  )
}
