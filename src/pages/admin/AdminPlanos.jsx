import { useState } from 'react'
import Modal from '../../components/Modal'
import { traduzirErro } from '../../lib/erros'
import { atualizarPlano } from '../../services/adminService'

function inteiroPositivo(texto) {
  const t = String(texto).trim()
  if (!/^\d+$/.test(t)) return null
  const n = Number(t)
  return n >= 1 ? n : null
}

function EditarPlano({ plano, usuariosNoPlano, aoFechar, aoSalvar }) {
  const ehTeste = plano.codigo === 'teste'
  const ehEmpresa = plano.codigo === 'empresa'

  const [limite, setLimite] = useState(
    plano.limite_orcamentos_mensal === null ? '' : String(plano.limite_orcamentos_mensal)
  )
  const [dias, setDias] = useState(plano.dias_teste === null ? '' : String(plano.dias_teste))
  const [ativo, setAtivo] = useState(plano.ativo)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function salvar(evento) {
    evento.preventDefault()
    setErro('')

    let limiteMensal = null
    if (!ehEmpresa && limite.trim() !== '') {
      limiteMensal = inteiroPositivo(limite)
      if (limiteMensal === null) {
        setErro('O limite mensal deve ser um número inteiro maior que zero (ou deixe vazio para ilimitado).')
        return
      }
    }

    let diasTeste = null
    if (ehTeste) {
      diasTeste = inteiroPositivo(dias)
      if (diasTeste === null) {
        setErro('Informe a duração do teste em dias (número inteiro maior que zero).')
        return
      }
    }

    setSalvando(true)
    try {
      await atualizarPlano(plano.codigo, { limiteMensal, diasTeste, ativo })
      await aoSalvar()
    } catch (e) {
      setErro(traduzirErro(e))
      setSalvando(false)
    }
  }

  return (
    <Modal
      titulo={`Editar plano ${plano.nome}`}
      aoFechar={() => {
        if (!salvando) aoFechar()
      }}
    >
      <form onSubmit={salvar} className="formulario">
        <div className="aviso aviso-sucesso">
          A mudança vale na hora para os {usuariosNoPlano} usuário(s) deste plano.
        </div>

        <label className="campo">
          <span>Limite de orçamentos por mês</span>
          <input
            type="text"
            inputMode="numeric"
            value={ehEmpresa ? '' : limite}
            onChange={(e) => setLimite(e.target.value)}
            placeholder="Vazio = ilimitado"
            disabled={ehEmpresa}
          />
        </label>
        {ehEmpresa && <p className="texto-suave texto-pequeno">O plano Empresa é sempre ilimitado.</p>}

        {ehTeste && (
          <label className="campo">
            <span>Duração do teste (dias)</span>
            <input
              type="text"
              inputMode="numeric"
              value={dias}
              onChange={(e) => setDias(e.target.value)}
            />
          </label>
        )}

        <label className="campo-checkbox">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            disabled={ehEmpresa}
          />
          Plano ativo
        </label>
        {!ativo && usuariosNoPlano > 0 && (
          <div className="aviso aviso-erro">
            Atenção: {usuariosNoPlano} usuário(s) estão neste plano e podem ficar sem acesso.
          </div>
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
          <button type="submit" className="botao botao-primario" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function AdminPlanos({ planos, usuarios, aoMudar }) {
  const [editando, setEditando] = useState(null)

  const contar = (codigo) => usuarios.filter((u) => u.plano_codigo === codigo).length

  return (
    <div>
      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th>Plano</th>
              <th>Orçamentos por mês</th>
              <th>Teste</th>
              <th>Usuários</th>
              <th>Situação</th>
              <th className="coluna-acoes">Ações</th>
            </tr>
          </thead>
          <tbody>
            {planos.map((p) => (
              <tr key={p.codigo} className={p.ativo ? '' : 'linha-inativa'}>
                <td data-rotulo="Plano">
                  <strong>{p.nome}</strong>
                  {p.descricao && <div className="texto-suave texto-pequeno">{p.descricao}</div>}
                </td>
                <td data-rotulo="Orçamentos por mês">
                  {p.limite_orcamentos_mensal === null ? 'Ilimitado' : p.limite_orcamentos_mensal}
                </td>
                <td data-rotulo="Teste">{p.dias_teste ? `${p.dias_teste} dias` : '—'}</td>
                <td data-rotulo="Usuários">{contar(p.codigo)}</td>
                <td data-rotulo="Situação">
                  <span className={`etiqueta ${p.ativo ? 'etiqueta-ativa' : 'etiqueta-inativa'}`}>
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="coluna-acoes">
                  <button type="button" className="botao-tabela" onClick={() => setEditando(p)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editando && (
        <EditarPlano
          plano={editando}
          usuariosNoPlano={contar(editando.codigo)}
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
