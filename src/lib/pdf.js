import { formatarData, formatarMoeda } from './formatar'

function quantidadeParaTexto(quantidade) {
  return String(Number(quantidade)).replace('.', ',')
}

function nomeDoArquivo(orcamento) {
  const cliente = String(orcamento.cliente || 'cliente')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return `orcamento-${orcamento.id}-${cliente || 'cliente'}.pdf`
}

// Gera e baixa o PDF do orçamento.
// As bibliotecas são carregadas só quando o botão é clicado (deixa o app mais leve).
export async function baixarPdfOrcamento(orcamento, perfil) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const largura = doc.internal.pageSize.getWidth()
  const margem = 16
  const verde = [22, 163, 74]
  const escuro = [15, 23, 42]
  const suave = [100, 116, 139]

  // ---------- Cabeçalho (dados da empresa) ----------
  const empresa = perfil?.nome_empresa || perfil?.nome_responsavel || 'Orçamento'
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...escuro)
  doc.text(empresa, margem, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...suave)

  const contatos = [
    perfil?.nome_empresa && perfil?.nome_responsavel ? perfil.nome_responsavel : null,
    perfil?.documento ? `CPF/CNPJ: ${perfil.documento}` : null,
    [perfil?.telefone, perfil?.whatsapp && perfil.whatsapp !== perfil.telefone ? perfil.whatsapp : null]
      .filter(Boolean)
      .join('  /  ') || null,
    perfil?.email || null,
    perfil?.endereco || null,
  ].filter(Boolean)

  let y = 26
  for (const linha of contatos) {
    doc.text(String(linha), margem, y)
    y += 5
  }

  // Faixa verde
  y = Math.max(y + 2, 40)
  doc.setFillColor(...verde)
  doc.rect(margem, y, largura - margem * 2, 1.2, 'F')

  // ---------- Título e datas ----------
  y += 12
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...escuro)
  doc.text(`Orçamento nº ${orcamento.id}`, margem, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...suave)
  doc.text(`Emitido em ${formatarData(orcamento.created_at)}`, largura - margem, y - 6, {
    align: 'right',
  })
  if (orcamento.validade) {
    doc.text(`Válido até ${formatarData(orcamento.validade)}`, largura - margem, y, {
      align: 'right',
    })
  }

  // ---------- Cliente ----------
  y += 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...suave)
  doc.text('CLIENTE', margem, y)

  y += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...escuro)
  doc.text(String(orcamento.cliente), margem, y)

  if (orcamento.telefone) {
    y += 5.5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...suave)
    doc.text(String(orcamento.telefone), margem, y)
  }

  // ---------- Tabela de itens ----------
  autoTable(doc, {
    startY: y + 8,
    margin: { left: margem, right: margem },
    head: [['Descrição', 'Qtd.', 'Valor unit.', 'Subtotal']],
    body: orcamento.itens.map((item) => [
      item.descricao,
      quantidadeParaTexto(item.quantidade),
      formatarMoeda(item.valor_unitario),
      formatarMoeda(item.quantidade * item.valor_unitario),
    ]),
    foot: [['', '', 'Total', formatarMoeda(orcamento.valor)]],
    theme: 'striped',
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 3, textColor: escuro },
    headStyles: { fillColor: verde, textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: escuro, fontStyle: 'bold', fontSize: 11 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 34 },
      3: { halign: 'right', cellWidth: 34 },
    },
  })

  // ---------- Observações ----------
  let fim = doc.lastAutoTable.finalY + 10
  if (orcamento.observacoes) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...suave)
    doc.text('OBSERVAÇÕES', margem, fim)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...escuro)
    const texto = doc.splitTextToSize(String(orcamento.observacoes), largura - margem * 2)
    doc.text(texto, margem, fim + 6)
    fim += 6 + texto.length * 5
  }

  // ---------- Rodapé em todas as páginas ----------
  const totalPaginas = doc.getNumberOfPages()
  const altura = doc.internal.pageSize.getHeight()
  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    doc.setPage(pagina)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...suave)
    doc.text('Gerado pelo OrçaZap', margem, altura - 10)
    doc.text(`Página ${pagina} de ${totalPaginas}`, largura - margem, altura - 10, {
      align: 'right',
    })
  }

  doc.save(nomeDoArquivo(orcamento))
}
