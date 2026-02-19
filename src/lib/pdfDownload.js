import html2pdf from 'html2pdf.js'

/**
 * oklch CSS 변수 이름 목록
 * App.css에서 :root에 정의된 oklch 색상 변수들
 */
const CSS_VAR_NAMES = [
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
  return rgbValue
}

/**
 * 클론된 문서에서 oklch 색상을 rgb로 교체
 * html2canvas가 oklch() 색상 함수를 지원하지 않으므로,
 * 클론된 문서의 스타일시트와 인라인 스타일을 수정
 */
function fixOklchInClonedDoc(clonedDoc) {
  const root = clonedDoc.documentElement
  const originalStyle = getComputedStyle(document.documentElement)

  // 1. :root CSS 변수를 rgb 값으로 인라인 오버라이드
  CSS_VAR_NAMES.forEach(varName => {
    const raw = originalStyle.getPropertyValue(varName).trim()
    if (raw) {
      const rgbValue = oklchToRgb(raw)
      root.style.setProperty(varName, rgbValue)
    }
  })

  // 2. 클론된 문서의 스타일시트에서 oklch 규칙 제거/비활성화
  try {
    const sheets = clonedDoc.styleSheets
    for (let i = 0; i < sheets.length; i++) {
      try {
        const rules = sheets[i].cssRules
        if (!rules) continue
        for (let j = rules.length - 1; j >= 0; j--) {
          const ruleText = rules[j].cssText || ''
          if (ruleText.includes('oklch')) {
            sheets[i].deleteRule(j)
          }
        }
      } catch (e) {
        // Cross-origin 스타일시트는 접근 불가 - 무시
      }
    }
  } catch (e) {
    // 스타일시트 수정 실패 시 무시
  }
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
      // oklch → rgb 변환을 클론 문서에서 수행
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
      // onclone은 항상 oklch 변환 포함
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
