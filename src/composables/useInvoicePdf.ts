// src/composables/useInvoicePdf.ts
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { supabase } from '@/lib/supabaseClient'

export async function generateAndStoreInvoicePdf(opts: {
  userId: string
  invoiceId: string
  invoiceNumber: string
}): Promise<{ pdfUrl: string; path: string }> {
  const node = document.getElementById('invoice-preview')
  if (!node) throw new Error('#invoice-preview not found')

  // 1) Render DOM to canvas
  const canvas = await html2canvas(node as HTMLElement, {
    scale: 1.5, // was 2; smaller -> lighter PDF
    useCORS: true,
    backgroundColor: '#ffffff',
  })
  const imgData = canvas.toDataURL('image/jpeg', 0.82)

  // 2) Create A4 PDF
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()

  const imgW = pageW
  const imgH = (canvas.height / canvas.width) * imgW

  if (imgH <= pageH) {
    pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH)
  } else {
    // Multi-page support
    let remaining = imgH
    let offsetYmm = 0
    while (remaining > 0) {
      pdf.addImage(imgData, 'JPEG', 0, -offsetYmm, imgW, imgH)
      remaining -= pageH
      if (remaining > 0) {
        pdf.addPage()
        offsetYmm += pageH
      }
    }
  }

  const blob = pdf.output('blob')

  // 3) Upload to Supabase Storage
  const path = `invoices/${opts.userId}/${opts.invoiceNumber}.pdf`
  const { error: uploadError } = await supabase.storage
    .from('invoices')
    .upload(path, blob, { upsert: true })

  if (uploadError) throw uploadError

  // 4) Get URL (signed for private bucket)
  const { data: signed, error: signError } = await supabase.storage
    .from('invoices')
    .createSignedUrl(path, 60 * 60 * 24 * 7) // valid for 7 days

  if (signError) throw signError
  const pdfUrl = signed!.signedUrl

  // 5) Save pdf_url to invoices
  const { error: updateError } = await supabase
    .from('invoices')
    .update({ pdf_url: pdfUrl })
    .eq('id', opts.invoiceId)

  if (updateError) throw updateError

  return { pdfUrl, path }
}
