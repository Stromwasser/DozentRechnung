// src/composables/useInvoicePdf.ts
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { supabase } from '@/lib/supabaseClient'

type GenOpts = {
  userId: string
  invoiceId: string
  invoiceNumber: string
}

type GenResult = {
  pdfUrl: string // signed url (temporary)
  path: string // stable storage path
  expiresAt: string // ISO timestamp when signed url expires
}

export async function generateAndStoreInvoicePdf(opts: GenOpts): Promise<GenResult> {
  const node = document.getElementById('invoice-preview')
  if (!node) throw new Error('#invoice-preview not found')

  // 1) Render DOM to canvas
  const canvas = await html2canvas(node as HTMLElement, {
    scale: 1.5, // 1.5 достаточно для A4 (вес/качество)
    useCORS: true,
    backgroundColor: '#ffffff',
    // windowWidth: node.scrollWidth, // опционально, если нужно точное соотношение
  })
  const imgData = canvas.toDataURL('image/jpeg', 0.82)

  // 2) Create A4 PDF: поля страницы и выравнивание по низу (футер у нижнего края)
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()

  const marginLeft = 18
  const marginRight = 18
  const marginTop = 18
  const marginBottom = 8 // минимальный отступ от нижнего края листа
  const contentW = pageW - marginLeft - marginRight
  const contentH = pageH - marginTop - marginBottom

  const imgW = contentW
  const imgH = (canvas.height / canvas.width) * imgW

  if (imgH <= contentH) {
    // Фиксированное верхнее поле: изображение всегда от верхнего края
    pdf.addImage(imgData, 'JPEG', marginLeft, marginTop, imgW, imgH)
  } else {
    // Многостраничный: стандартная логика
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

  // Создаём Blob корректного MIME
  const blob = new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' })

  // 3) Upload to Supabase Storage (upsert = true, чтобы перезаписывать по номеру)
  const safeNumber = opts.invoiceNumber.replace(/[^A-Za-z0-9._-]/g, '_')
  const path = `invoices/${opts.userId}/${safeNumber}.pdf`

  const { error: uploadError } = await supabase.storage.from('invoices').upload(path, blob, {
    upsert: true,
    contentType: 'application/pdf',
  })

  if (uploadError) throw new Error('PDF-Upload: ' + (uploadError.message || String(uploadError)))

  // 4) Create signed URL (например, на 7 дней)
  const expiresIn = 60 * 60 * 24 * 7 // 7 дней
  const { data: signed, error: signError } = await supabase.storage
    .from('invoices')
    .createSignedUrl(path, expiresIn)

  if (signError || !signed?.signedUrl) {
    throw new Error('PDF-URL: ' + (signError?.message || 'Failed to create signed URL'))
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + expiresIn * 1000).toISOString()
  const pdfUrl = signed.signedUrl

  // 5) Save path + signed url (optional) to invoices
  // В БД хорошо иметь стабильный путь (pdf_path) — по нему можно всегда сгенерить новую ссылку.
  // signed url можно хранить для быстрого показа, пометив срок годности.
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      pdf_path: path, // <-- стабильный путь в бакете
      pdf_signed_url: pdfUrl, // <-- текущая временная ссылка (необязательно)
      pdf_url_expires_at: expiresAt,
      // pdf_url: null,            // если раньше было поле pdf_url — лучше больше не использовать
    })
    .eq('id', opts.invoiceId)

  if (updateError) throw new Error('PDF-Speichern: ' + (updateError.message || String(updateError)))

  return { pdfUrl, path, expiresAt }
}
