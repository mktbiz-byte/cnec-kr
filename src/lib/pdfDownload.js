import html2pdf from 'html2pdf.js'

/**
 * oklch 색상 값을 브라우저가 지원하는 rgb로 변환
 */
function oklchToRgb(oklchValue) {
  const temp = document.createElement('div')
  temp.style.color = oklchValue
  temp.style.display = 'none'
  document.body.appendChild(temp)
  const rgbValue = getComputedStyle(temp).color
  document.body.removeChild(temp)
  return rgbValue || 'rgb(0, 0, 0)'
}

/**
 * 원본 문서의 스타일시트에서 oklch를 rgb로 치환하고 복원 함수를 반환
 *
 * 전략: html2canvas가 문서를 클론할 때 oklch가 없는 상태로 복사되도록,
 * 클론 전에 원본 문서의 스타일을 직접 수정한 뒤 PDF 생성 후 복원
 */
function patchOklchInDocument() {
  const cache = new Map()
  const convert = (match) => {
    if (cache.has(match)) return cache.get(match)
    const rgb = oklchToRgb(match)
    cache.set(match, rgb)
    return rgb
  }

  const restoreFns = []

  // 1. <style> 요소의 textContent에서 oklch 치환
  document.querySelectorAll('style').forEach(el => {
    const text = el.textContent
    if (text && text.includes('oklch')) {
      const original = text
      el.textContent = text.replace(/oklch\([^)]+\)/g, convert)
      restoreFns.push(() => { el.textContent = original })
    }
  })

  // 2. <link rel="stylesheet"> 로 로드된 외부 CSS 파일 처리
  //    CSSOM에서 읽어서 inline <style>로 교체
  const processedLinks = []
  for (const sheet of document.styleSheets) {
    if (!sheet.href) continue // <style> 요소는 위에서 처리
    try {
      const rules = Array.from(sheet.cssRules)
      const text = rules.map(r => r.cssText).join('\n')
      if (!text.includes('oklch')) continue

      const fixedText = text.replace(/oklch\([^)]+\)/g, convert)
      const linkEl = sheet.ownerNode

      // <link>를 비활성화하고 인라인 <style>로 교체
      linkEl.disabled = true
      const inlineStyle = document.createElement('style')
      inlineStyle.dataset.pdfOklchFix = 'true'
      inlineStyle.textContent = fixedText
      document.head.appendChild(inlineStyle)

      processedLinks.push({ linkEl, inlineStyle })
    } catch (e) {
      // Cross-origin 스타일시트 접근 불가
    }
  }

  // 3. :root CSS 변수도 인라인으로 오버라이드
  const root = document.documentElement
  const originalRootStyle = root.getAttribute('style') || ''
  const computedStyle = getComputedStyle(root)
  const varNames = [
    '--background', '--foreground', '--card', '--card-foreground',
    '--popover', '--popover-foreground', '--primary', '--primary-foreground',
    '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
    '--accent', '--accent-foreground', '--destructive',
    '--border', '--input', '--ring',
    '--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5',
    '--sidebar', '--sidebar-foreground', '--sidebar-primary',
    '--sidebar-primary-foreground', '--sidebar-accent',
    '--sidebar-accent-foreground', '--sidebar-border', '--sidebar-ring',
  ]
  varNames.forEach(varName => {
    const raw = computedStyle.getPropertyValue(varName).trim()
    if (raw) {
      root.style.setProperty(varName, raw.includes('oklch') ? oklchToRgb(raw) : raw)
    }
  })

  // 복원 함수 반환
  return function restore() {
    // <style> 요소 복원
    restoreFns.forEach(fn => fn())
    // <link> 복원
    processedLinks.forEach(({ linkEl, inlineStyle }) => {
      linkEl.disabled = false
      inlineStyle.remove()
    })
    // :root 인라인 스타일 복원
    if (originalRootStyle) {
      root.setAttribute('style', originalRootStyle)
    } else {
      root.removeAttribute('style')
    }
  }
}

/**
 * HTML 요소를 PDF로 변환하여 다운로드
 * @param {HTMLElement} element - PDF로 변환할 DOM 요소
 * @param {string} filename - 출력 파일명 (.pdf 확장자 제외)
 * @param {object} options - html2pdf 추가 옵션
 */
export async function downloadElementAsPdf(element, filename = 'guide', options = {}) {
  // PDF 생성 전에 oklch → rgb 치환 (원본 문서 직접 수정)
  const restoreOklch = patchOklchInDocument()

  try {
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
      ...options,
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
        ...(options.html2canvas || {}),
      },
    }

    await html2pdf().set(pdfOptions).from(element).save()
  } finally {
    // 항상 원본 스타일 복원
    restoreOklch()
  }
}
