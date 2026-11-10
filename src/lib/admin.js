import { formatarData } from './formatar'

export const STATUS_LICENCA = ['ativa', 'expirada', 'suspensa', 'cancelada']

export const ROTULO_STATUS = {
  ativa: 'Ativa',
  expirada: 'Expirada',
  suspensa: 'Suspensa',
  cancelada: 'Cancelada',
}

const NOMES_PLANOS = {
  teste: 'Teste',
  basico: 'Básico',
  profissional: 'Profissional',
  empresa: 'Empresa',
}

export function nomePlano(codigo) {
  return NOMES_PLANOS[codigo] || codigo || '—'
}

// Situação de um usuário para mostrar na tabela.
// "Vencida" = status ativa, mas a data de expiração já passou.
export function situacaoLicenca(usuario, agora = new Date()) {
  if (!usuario.plano_codigo || !usuario.status_licenca) {
    return { codigo: 'sem_licenca', rotulo: 'Sem licença', classe: 'etiqueta-recusado' }
  }
  if (
    usuario.status_licenca === 'ativa' &&
    usuario.expira_em &&
    new Date(usuario.expira_em) < agora
  ) {
    return { codigo: 'vencida', rotulo: 'Vencida', classe: 'etiqueta-pendente' }
  }
  const classes = {
    ativa: 'etiqueta-ativa',
    expirada: 'etiqueta-pendente',
    suspensa: 'etiqueta-inativa',
    cancelada: 'etiqueta-recusado',
  }
  return {
    codigo: usuario.status_licenca,
    rotulo: ROTULO_STATUS[usuario.status_licenca] || usuario.status_licenca,
    classe: classes[usuario.status_licenca] || 'etiqueta-inativa',
  }
}

export function contarUsuarios(usuarios, agora = new Date()) {
  const contagem = { total: usuarios.length, ativas: 0, vencidas: 0, semLicenca: 0 }
  for (const u of usuarios) {
    const { codigo } = situacaoLicenca(u, agora)
    if (codigo === 'ativa') contagem.ativas += 1
    else if (codigo === 'vencida' || codigo === 'expirada') contagem.vencidas += 1
    else if (codigo === 'sem_licenca') contagem.semLicenca += 1
  }
  return contagem
}

function doisDigitos(n) {
  return String(n).padStart(2, '0')
}

function dataParaCampo(data) {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`
}

// Carimbo do banco -> texto do campo de data ("2026-11-30"), no fuso do usuário.
export function expiraParaCampo(iso) {
  if (!iso) return ''
  const data = new Date(iso)
  return Number.isNaN(data.getTime()) ? '' : dataParaCampo(data)
}

// Texto do campo de data -> carimbo para o banco. A licença vale até o fim do dia.
export function campoParaExpira(texto) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(texto || ''))
  if (!partes) return null
  const [, ano, mes, dia] = partes.map(Number)
  const data = new Date(ano, mes - 1, dia, 23, 59, 59)
  return Number.isNaN(data.getTime()) ? null : data.toISOString()
}

// Soma dias a partir da data do campo (ou de hoje, se estiver vazia ou já vencida).
export function somarDias(campo, dias, hoje = new Date()) {
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  let base = inicioHoje
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(campo || ''))
  if (partes) {
    const atual = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]))
    if (atual > inicioHoje) base = atual
  }
  return dataParaCampo(new Date(base.getFullYear(), base.getMonth(), base.getDate() + dias))
}

// ---------- Auditoria ----------

export const ROTULO_ACAO = {
  ALTERAR_LICENCA: 'Licença alterada',
  CRIAR_LICENCA: 'Licença criada',
  REPARAR_LICENCA: 'Licença reparada',
  ALTERAR_PLANO: 'Plano alterado',
}

const CAMPOS_AUDITADOS = {
  plano_codigo: { rotulo: 'Plano', valor: (v) => nomePlano(v) },
  status: { rotulo: 'Status', valor: (v) => ROTULO_STATUS[v] || v },
  expira_em: { rotulo: 'Vencimento', valor: (v) => (v ? formatarData(v) : 'vitalícia') },
  limite_orcamentos_mensal: {
    rotulo: 'Limite mensal',
    valor: (v) => (v === null || v === undefined ? 'ilimitado' : String(v)),
  },
  dias_teste: { rotulo: 'Dias de teste', valor: (v) => (v === null || v === undefined ? '—' : String(v)) },
  ativo: { rotulo: 'Plano ativo', valor: (v) => (v ? 'sim' : 'não') },
}

// Compara "antes" e "depois" e devolve frases curtas, ex.: "Plano: Básico → Profissional".
export function resumirMudancas(anterior, novo) {
  if (!novo) return []
  const frases = []
  for (const [campo, { rotulo, valor }] of Object.entries(CAMPOS_AUDITADOS)) {
    if (!(campo in novo)) continue
    const depois = novo[campo]
    if (!anterior) {
      frases.push(`${rotulo}: ${valor(depois)}`)
    } else if (JSON.stringify(anterior[campo]) !== JSON.stringify(depois)) {
      frases.push(`${rotulo}: ${valor(anterior[campo])} → ${valor(depois)}`)
    }
  }
  return frases
}
