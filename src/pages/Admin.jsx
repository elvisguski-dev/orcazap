import { useCallback, useEffect, useState } from 'react'
import { traduzirErro } from '../lib/erros'
import { listarPlanos, listarUsuarios } from '../services/adminService'
import AdminAuditoria from './admin/AdminAuditoria'
import AdminPlanos from './admin/AdminPlanos'
import AdminUsuarios from './admin/AdminUsuarios'

const ABAS = [
  { id: 'usuarios', rotulo: 'Usuários' },
  { id: 'planos', rotulo: 'Planos' },
  { id: 'auditoria', rotulo: 'Histórico' },
]

export default function Admin() {
  const [aba, setAba] = useState('usuarios')
  const [usuarios, setUsuarios] = useState([])
  const [planos, setPlanos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    setErro('')
    try {
      const [listaUsuarios, listaPlanos] = await Promise.all([listarUsuarios(), listarPlanos()])
      setUsuarios(listaUsuarios)
      setPlanos(listaPlanos)
    } catch (e) {
      setErro(traduzirErro(e))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  return (
    <div>
      <header className="pagina-cabecalho">
        <div>
          <h1>Administração</h1>
          <p className="texto-suave">Usuários, licenças, planos e histórico de alterações.</p>
        </div>
      </header>

      <div className="abas" role="tablist">
        {ABAS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={aba === item.id}
            className={`aba ${aba === item.id ? 'ativa' : ''}`}
            onClick={() => setAba(item.id)}
          >
            {item.rotulo}
          </button>
        ))}
      </div>

      {erro && (
        <div className="aviso aviso-erro" role="alert">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="card card-aviso">Carregando…</div>
      ) : (
        <>
          {aba === 'usuarios' && (
            <AdminUsuarios usuarios={usuarios} planos={planos} aoMudar={carregar} />
          )}
          {aba === 'planos' && <AdminPlanos planos={planos} usuarios={usuarios} aoMudar={carregar} />}
          {aba === 'auditoria' && <AdminAuditoria usuarios={usuarios} />}
        </>
      )}
    </div>
  )
}
