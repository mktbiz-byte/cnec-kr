import html2pdf from 'html2pdf.js'

/**
 * HTML 요소를 PDF로 변환하여 다운로드
 * @param {HTMLElement} element - PDF로 변환할 DOM 요소
 * @param {string} filename - 출력 파일명 (.pdf 확장자 제외)
 * @param {object} options - html2pdf 추가 옵션
 */
export async function downloadElementAsPdf(element, filename = 'guide', options = {}) {
  const defaultOptions = {
    margin: [10, 10, 10, 10],
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  }

  const mergedOptions = { ...defaultOptions, ...options }

  await html2pdf().set(mergedOptions).from(element).save()
}
