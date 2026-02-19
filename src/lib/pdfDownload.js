import html2pdf from 'html2pdf.js'

/**
 * oklch 색상 값을 브라우저가 지원하는 rgb로 변환
 * 브라우저의 CSS 엔진을 이용해 oklch → rgb 변환
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
 * 클론된 문서에서 모든 oklch 색상을 rgb로 치환
 * html2canvas는 oklch() 색상 함수를 지원하지 않으므로,
 * 스타일시트 텍스트의 모든 oklch(...)를 rgb(...)로 치환
 */
function fixOklchInClonedDoc(clonedDoc) {
  // oklch(...)를 rgb로 변환하는 캐시 (동일 값 반복 변환 방지)
  const cache = new Map()
  function convertOklch(match) {
    if (cache.has(match)) return cache.get(match)
    const rgb = oklchToRgb(match)
    cache.set(match, rgb)
    return rgb
  }

  // 1. 모든 스타일시트의 oklch를 rgb로 치환
  const sheets = Array.from(clonedDoc.styleSheets)
  sheets.forEach(sheet => {
    try {
      const rules = sheet.cssRules
      if (!rules) return

      // 모든 규칙의 CSS 텍스트를 합침 (@layer, @media 포함)
      const fullCssText = Array.from(rules).map(r => r.cssText).join('\n')

      if (!fullCssText.includes('oklch')) return

      // oklch(...) 패턴을 rgb로 변환 (알파값 포함: oklch(0.5 0.2 30 / 50%))
      const fixedCss = fullCssText.replace(/oklch\([^)]+\)/g, convertOklch)

      // 기존 스타일시트를 새 스타일로 교체
      const ownerNode = sheet.ownerNode
      if (ownerNode && ownerNode.parentNode) {
        const newStyle = clonedDoc.createElement('style')
        newStyle.textContent = fixedCss
        ownerNode.parentNode.insertBefore(newStyle, ownerNode)
        ownerNode.parentNode.removeChild(ownerNode)
      }
    } catch (e) {
      // Cross-origin 스타일시트는 접근 불가 - 무시
    }
  })

  // 2. :root 인라인 스타일에도 CSS 변수를 rgb로 오버라이드 (안전장치)
  const root = clonedDoc.documentElement
  const originalStyle = getComputedStyle(document.documentElement)
  const allVarNames = [
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
  allVarNames.forEach(varName => {
    const raw = originalStyle.getPropertyValue(varName).trim()
    if (raw) {
      const rgbValue = raw.includes('oklch') ? oklchToRgb(raw) : raw
      root.style.setProperty(varName, rgbValue)
    }
  })
}

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
      onclone: (clonedDoc) => {
        fixOklchInClonedDoc(clonedDoc)
      },
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  }

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    html2canvas: {
      ...defaultOptions.html2canvas,
      ...(options.html2canvas || {}),
      onclone: (clonedDoc) => {
        fixOklchInClonedDoc(clonedDoc)
        if (options.html2canvas?.onclone) {
          options.html2canvas.onclone(clonedDoc)
        }
      },
    },
  }

  await html2pdf().set(mergedOptions).from(element).save()
}
