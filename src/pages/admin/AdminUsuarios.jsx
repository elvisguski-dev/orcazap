import { useMemo, useState } from 'react'
import Modal from '../../components/Modal'
import { traduzirErro } from '../../lib/erros'
import {
  campoParaExpira,
  contarUsuarios,
  expiraParaCampo,
  nomePlano,
  ROTULO_STATUS,
  situacaoLicenca,
  somarDias,
  STATUS_LICENCA,
} from '../../lib/admin'
import { formatarData, formatarDataHora } from '../../lib/formatar'
import { atualizarLicenca, criarLicenca } from '../../services/adminService'

function semAcento(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function formularioInicial(usuario, planos) {
  if (usuario.plano_codigo) {
    return {
      plano: usuario.plano_codigo,
      status: usuario.status_licenca,
      vitalicia: !usuario.expira_em,
      expira: expiraParaCampo(usuario.expira_em),
    }
  }
  // Usuário sem licença: sugere o plano Teste com os dias configurados.
  const teste = planos.find((p) => p.codigo === 'teste' && p.ativo)
  return {
    plano: teste ? 'teste' : planos.find((p) => p.ativo)?.codigo || '',
    status: 'ativa',
    vitalicia: !teste?.dias_teste,
    expira: teste?.dias_teste ? somarDias('', teste.dias_teste) : '',
  }
}

function EditarLicenca({ usuario, planos, aoFechar, aoSalvar }) {
  const semLicenca = !usuario.plano_codigo
  const [form, setForm] = useState(() => formularioInicial(usuario, planos))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const planosAtivos = planos.filter((p) => p.ativo)
  const travado = usuario.eh_administrador

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  function renovar(dias) {
    setForm((atual) => ({ ...atual, vitalicia: false, expira: somarDias(atual.expira, dias) }))
  }

  async function salvar(evento) {
    evento.preventDefault()
    setErro('')

    if (!form.plano) {
      setErro('Escolha um plano.')
      return
    }
    let expiraEm = null
    if (!form.vitalicia) {
      expiraEm = campoParaExpira(form.expira)
      if (!expiraEm) {
        setErro('Informe a data de vencimento ou marque "Licença vitalícia".')
        return
      }
    }

    setSalvando(true)
    try {
      const dados = { plano: form.plano, status: form.status, expiraEm }
      if (semLicenca) await criarLicenca(usuario.user_id, dados)
      else await atualizarLicenca(usuario.user_id, dados)
      await aoSalvar()
    } catch (e) {
      setErro(traduzirErro(e))
      setSalvando(false)
    }
  }

  return (
    <Modal
      titulo={semLicenca ? 'Criar licença' : 'Editar licença'}
      aoFechar={() => {
        if (!salvando) aoFechar()
      }}
    >
      <form onSubmit={salvar} className="formulario">
        <p className="texto-suave">{usuario.email}</p>

        {travado && (
          <div className="aviso aviso-sucesso">
            Conta administradora: precisa continuar no plano Empresa, ativa e vitalícia. O banco
            não permite mudar isso.
          </div>
        )}

        <label className="campo">
          <span>Plano</span>
          <select
            className="campo-filtro"
            value={form.plano}
            onChange={(e) => alterar('plano', e.target.value)}
            disabled={travado}
          >
            {planosAtivos.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="campo">
          <span>Status</span>
          <select
            className="campo-filtro"
            value={form.status}
            onChange={(e) => alterar('status', e.target.value)}
            disabled={travado}
          >
            {STATUS_LICENCA.map((s) => (
              <option key={s} value={s}>
                {ROTULO_STATUS[s]}
              </option>
            ))}
          </select>
        </label>

        <label className="campo-checkbox">
          <input
            type="checkbox"
            checked={form.vitalicia}
            onChange={(e) => alterar('vitalicia', e.target.checked)}
            disabled={travado}
          />
          Licença vitalícia (sem vencimento)
        </label>

        {!form.vitalicia && (
          <>
            <label className="campo">
              <span>Vence em</span>
              <input
                type="date"
                value={form.expira}
                onChange={(e) => alterar('expira', e.target.value)}
                disabled={travado}
              />
            </label>
            {!travado && (
              <div className="atalhos-data">
                <button type="button" className="botao-tabela" onClick={() => renovar(30)}>
                  +30 dias
                </button>
                <button type="button" className="botao-tabela" onClick={() => renovar(90)}>
                  +90 dias
                </button>
                <button type="button" className="botao-tabela" onClick={() => renovar(365)}>
                  +1 ano
                </button>
              </div>
            )}
          </>
        )}

        {erro && (
          <div className="aviso aviso-erro" role="alert">
            {erro}
          </div>
        )}

        <div className="acoes-formulario">
          <button type="button" className="botao botao-secundario" onClick={aoFechar} disabled={salvando}>
            Cancelar
          </button>
          <button type="submit" className="botao botao-primario" disabled={salvando || travado}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function AdminUsuarios({ usuarios, planos, aoMudar }) {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [editando, setEditando] = useState(null)

  const contagem = useMemo(() => contarUsuarios(usuarios), [usuarios])

  const filtrados = useMemo(() => {
    const termo = semAcento(busca.trim())
    return usuarios.filter((u) => {
      if (filtro !== 'todos' && situacaoLicenca(u).codigo !== filtro) return false
      return !termo || semAcento(u.email).includes(termo)
    })
  }, [usuarios, busca, filtro])

  return (
    <div>
      <div className="grade-cards grade-cards-4">
        <div className="card">
          <span className="card-rotulo">Usuários</span>
          <strong className="card-valor">{contagem.total}</strong>
        </div>
        <div className="card">
          <span className="card-rotulo">Licenças ativas</span>
          <strong className="card-valor">{contagem.ativas}</strong>
        </div>
        <div className="card">
          <span className="card-rotulo">Vencidas</span>
          <strong className="card-valor">{contagem.vencidas}</strong>
        </div>
        <div className="card">
          <span className="card-rotulo">Sem licença</span>
          <strong className="card-valor">{contagem.semLicenca}</strong>
        </div>
      </div>

      <div className="barra-ferramentas">
        <input
          type="search"
          className="campo-busca"
          placeholder="Buscar por e-mail"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select className="campo-filtro" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="todos">Todas as situações</option>
          <option value="ativa">Ativas</option>
          <option value="vencida">Vencidas</option>
          <option value="expirada">Expiradas</option>
          <option value="suspensa">Suspensas</option>
          <option value="cancelada">Canceladas</option>
          <option value="sem_licenca">Sem licença</option>
        </select>
      </div>

      {filtrados.length === 0 ? (
        <div className="card card-aviso">Nenhum usuário encontrado.</div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>E-mail</th>
                <th>Plano</th>
                <th>Situação</th>
                <th>Vence em</th>
                <th>Cadastro</th>
                <th>Último acesso</th>
                <th className="coluna-acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((u) => {
                const situacao = situacaoLicenca(u)
                return (
                  <tr key={u.user_id}>
                    <td data-rotulo="E-mail">
                      <strong>{u.email}</strong>
                      {u.eh_administrador && <span className="etiqueta etiqueta-admin">Admin</span>}
                    </td>
                    <td data-rotulo="Plano">{u.plano_codigo ? nomePlano(u.plano_codigo) : '—'}</td>
                    <td data-rotulo="Situação">
                      <span className={`etiqueta ${situacao.classe}`}>{situacao.rotulo}</span>
                    </td>
                    <td data-rotulo="Vence em">
                      {u.plano_codigo ? (u.expira_em ? formatarData(u.expira_em) : 'Vitalícia') : '—'}
                    </td>
                    <td data-rotulo="Cadastro">{formatarData(u.criado_em)}</td>
                    <td data-rotulo="Último acesso">{formatarDataHora(u.ultimo_login)}</td>
                    <td className="coluna-acoes">
                      <button type="button" className="botao-tabela" onClick={() => setEditando(u)}>
                        {u.plano_codigo ? 'Editar licença' : 'Criar licença'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <EditarLicenca
          usuario={editando}
          planos={planos}
          aoFechar={() => setEditando(null)}
          aoSalvar={async () => {
            await aoMudar()
            setEditando(null)
          }}
        />
      )}
    </div>
  )
}
