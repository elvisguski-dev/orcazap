import { useEffect, useMemo, useState } from 'react'
import { traduzirErro } from '../../lib/erros'
import { nomePlano, resumirMudancas, ROTULO_ACAO } from '../../lib/admin'
import { formatarDataHora } from '../../lib/formatar'
import { listarAuditoria } from '../../services/adminService'

export default function AdminAuditoria({ usuarios }) {
  const [limite, setLimite] = useState(100)
  const [registros, setRegistros] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro('')
    listarAuditoria(limite)
      .then((dados) => {
        if (ativo) setRegistros(dados)
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
  }, [limite, tentativa])

  const emailPorId = useMemo(() => {
    const mapa = {}
    for (const u of usuarios) mapa[u.user_id] = u.email
    return mapa
  }, [usuarios])

  function alvo(registro) {
    if (registro.entidade === 'plano') return `Plano ${nomePlano(registro.entidade_id)}`
    return emailPorId[registro.entidade_id] || registro.entidade_id
  }

  return (
    <div>
      <div className="barra-ferramentas">
        <select
          className="campo-filtro"
          value={limite}
          onChange={(e) => setLimite(Number(e.target.value))}
          aria-label="Quantidade de registros"
        >
          <option value={50}>Últimos 50</option>
          <option value={100}>Últimos 100</option>
          <option value={200}>Últimos 200</option>
          <option value={500}>Últimos 500</option>
        </select>
        <button
          type="button"
          className="botao botao-secundario"
          onClick={() => setTentativa((n) => n + 1)}
          disabled={carregando}
        >
          Atualizar
        </button>
      </div>

      {erro && (
        <div className="aviso aviso-erro" role="alert">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="card card-aviso">Carregando histórico…</div>
      ) : registros.length === 0 ? (
        <div className="card card-aviso">Nenhuma alteração registrada ainda.</div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Administrador</th>
                <th>Ação</th>
                <th>Alvo</th>
                <th>O que mudou</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id}>
                  <td data-rotulo="Quando">{formatarDataHora(r.created_at)}</td>
                  <td data-rotulo="Administrador">{r.admin_email}</td>
                  <td data-rotulo="Ação">{ROTULO_ACAO[r.acao] || r.acao}</td>
                  <td data-rotulo="Alvo">{alvo(r)}</td>
                  <td data-rotulo="O que mudou">
                    <ul className="lista-mudancas">
                      {resumirMudancas(r.dados_anteriores, r.dados_novos).map((frase) => (
                        <li key={frase}>{frase}</li>
                      ))}
                    </ul>
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
