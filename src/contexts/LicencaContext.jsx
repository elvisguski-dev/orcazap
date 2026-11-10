import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { buscarResumoUso, nomeDoPlano } from '../services/licencaService'

const LicencaContext = createContext(null)

const MENSAGENS_BLOQUEIO = {
  sem_licenca: 'Nenhuma licença ativa foi encontrada para esta conta.',
  expirada: 'Sua licença expirou.',
  suspensa: 'Sua licença está suspensa.',
  cancelada: 'Sua licença foi cancelada.',
}

export function LicencaProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [resumo, setResumo] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const recarregar = useCallback(async () => {
    if (!userId) return
    try {
      const dados = await buscarResumoUso()
      setResumo(dados)
      setErro(null)
    } catch (e) {
      setErro(e.message || 'Erro ao carregar a licença')
    } finally {
      setCarregando(false)
    }
  }, [userId])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  // Estados derivados (a regra real continua no banco; isto é só para avisar o usuário).
  const expirou = resumo?.expira_em ? new Date(resumo.expira_em) <= new Date() : false

  let motivoBloqueio = null
  if (!carregando && !erro) {
    if (!resumo) motivoBloqueio = 'sem_licenca'
    else if (resumo.status !== 'ativa') motivoBloqueio = resumo.status
    else if (expirou) motivoBloqueio = 'expirada'
  }

  const bloqueada = motivoBloqueio !== null
  const ilimitado = Boolean(resumo) && resumo.limite_mensal === null
  const limiteAtingido =
    !bloqueada && Boolean(resumo) && !ilimitado && resumo.restantes <= 0

  const valor = {
    resumo,
    carregando,
    erro,
    recarregar,
    nomePlano: resumo ? nomeDoPlano(resumo.plano) : '—',
    bloqueada,
    motivoBloqueio,
    mensagemBloqueio: motivoBloqueio ? MENSAGENS_BLOQUEIO[motivoBloqueio] || 'Licença bloqueada.' : '',
    ilimitado,
    limiteAtingido,
    podeCriarOrcamento: !bloqueada && !limiteAtingido && Boolean(resumo),
  }

  return <LicencaContext.Provider value={valor}>{children}</LicencaContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLicenca() {
  const contexto = useContext(LicencaContext)
  if (!contexto) throw new Error('useLicenca deve ser usado dentro de <LicencaProvider>')
  return contexto
}
