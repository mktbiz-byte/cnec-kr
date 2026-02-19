import html2pdf from 'html2pdf.js'

/**
 * HTML 요소를 PDF로 변환하여 다운로드
 *
 * html2canvas@1.4.1은 pnpm patch를 통해 oklch/oklab 색상 함수를 지원하도록 패치됨.
 * (patches/html2canvas@1.4.1.patch 참조)
 */
export async function downloadElementAsPdf(element, filename = 'guide', options = {}) {
  const pdfOptions = {
    margin: [10, 10, 10, 10],
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      ...(options.html2canvas || {}),
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  }

  await html2pdf().set(pdfOptions).from(element).save()
}
