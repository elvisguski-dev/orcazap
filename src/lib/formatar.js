export function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

// Converte o que o usuário digitou ("12,50", "1.234,50", "12.5") em número.
// Retorna NaN se não for um número válido.
export function paraNumero(texto) {
  let t = String(texto ?? '').trim().replace(/[R$\s]/g, '')
  if (!t) return NaN
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  return Number(t)
}

// Converte um número do banco para o texto do campo ("12,50").
export function numeroParaCampo(numero) {
  return Number(numero || 0).toFixed(2).replace('.', ',')
}

// Aceita uma data simples do banco ("2026-11-30") ou um carimbo de data/hora.
// Datas simples são tratadas à parte para não "voltar um dia" por causa do fuso.
export function formatarData(valor) {
  if (!valor) return '—'
  const texto = String(valor)
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const [ano, mes, dia] = texto.split('-')
    return `${dia}/${mes}/${ano}`
  }
  return new Date(texto).toLocaleDateString('pt-BR')
}
