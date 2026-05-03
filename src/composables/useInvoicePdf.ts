import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { putPdfBlob } from '@/lib/localPdfDb'
import { localUpdateInvoicePdfMeta } from '@/lib/localStore'

export async function generateAndStoreInvoicePdf(opts: {
  invoiceId: string
  invoiceNumber: string
}): Promise<{ pdfUrl: string; path: string; expiresAt: string }> {
  const node = document.getElementById('invoice-preview')
  if (!node) throw new Error('#invoice-preview not found')

  const canvas = await html2canvas(node as HTMLElement, {
    scale: 1.5,
    useCORS: true,
    backgroundColor: '#ffffff',
  })
  const imgData = canvas.toDataURL('image/jpeg', 0.82)

  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()

  const marginLeft = 18
  const marginRight = 18
  const marginTop = 18
  const marginBottom = 8
  const contentW = pageW - marginLeft - marginRight
  const contentH = pageH - marginTop - marginBottom

  const imgW = contentW
  const imgH = (canvas.height / canvas.width) * imgW

  if (imgH <= contentH) {
    pdf.addImage(imgData, 'JPEG', marginLeft, marginTop, imgW, imgH)
  } else {
    let offsetYmm = 0
    let remaining = imgH
    while (remaining > 0) {
      pdf.addImage(imgData, 'JPEG', marginLeft, marginTop - offsetYmm, imgW, imgH)
      remaining -= contentH
      if (remaining > 0) {
        pdf.addPage()
        offsetYmm += contentH
      }
    }
  }

  const blob = new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' })
  await putPdfBlob(opts.invoiceId, blob)

  const path = `local:${opts.invoiceId}`
  const pdfUrl = URL.createObjectURL(blob)
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  localUpdateInvoicePdfMeta(opts.invoiceId, path, pdfUrl, expiresAt)

  return { pdfUrl, path, expiresAt }
}
