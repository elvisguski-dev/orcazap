import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [recuperandoSenha, setRecuperandoSenha] = useState(false)
  // null = ainda verificando, true/false = resultado de eh_admin()
  const [ehAdmin, setEhAdmin] = useState(null)

  useEffect(() => {
    let ativo = true

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return
      setSession(data.session)
      setCarregando(false)
    })

    // Importante: não chamar o Supabase de dentro deste callback.
    const { data: ouvinte } = supabase.auth.onAuthStateChange((evento, novaSessao) => {
      if (evento === 'PASSWORD_RECOVERY') setRecuperandoSenha(true)
      if (evento === 'SIGNED_OUT') setRecuperandoSenha(false)
      setSession(novaSessao)
    })

    return () => {
      ativo = false
      ouvinte.subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user?.id ?? null

  // A regra de admin vem do banco (função eh_admin), nunca do navegador.
  useEffect(() => {
    let ativo = true

    if (!userId) {
      Promise.resolve().then(() => ativo && setEhAdmin(false))
      return () => {
        ativo = false
      }
    }

    supabase.rpc('eh_admin').then(({ data, error }) => {
      if (ativo) setEhAdmin(!error && data === true)
    })

    return () => {
      ativo = false
    }
  }, [userId])

  async function signIn(email, senha) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) throw error
  }

  async function signUp(email, senha) {
    const { data, error } = await supabase.auth.signUp({ email, password: senha })
    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) throw error
  }

  async function updatePassword(novaSenha) {
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    if (error) throw error
    setRecuperandoSenha(false)
  }

  const valor = {
    session,
    user: session?.user ?? null,
    carregando,
    recuperandoSenha,
    ehAdmin,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  }

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return contexto
}
