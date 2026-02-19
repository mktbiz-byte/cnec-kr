import html2pdf from 'html2pdf.js'

/**
 * oklch 색상을 수학적으로 rgb로 변환 (브라우저 의존 없음)
 * 최신 Chrome이 getComputedStyle에서 oklch를 그대로 반환하는 문제 해결
 */
function oklchToRgb(oklchStr) {
  const match = oklchStr.match(
    /oklch\(\s*([\d.]+%?|none)\s+([\d.]+%?|none)\s+([\d.]+(?:deg)?|none)(?:\s*\/\s*([\d.]+%?|none))?\s*\)/
  )
  if (!match) return 'rgb(0, 0, 0)'

  let L = match[1] === 'none' ? 0 : parseFloat(match[1])
  if (match[1]?.endsWith('%')) L = L / 100

  let C = match[2] === 'none' ? 0 : parseFloat(match[2])

  let H = match[3] === 'none' ? 0 : parseFloat(match[3])

  let alpha = 1
  if (match[4] && match[4] !== 'none') {
    alpha = parseFloat(match[4])
    if (match[4].endsWith('%')) alpha = alpha / 100
  }

  // oklch → oklab
  const hRad = H * Math.PI / 180
  const a_ = C * Math.cos(hRad)
  const b_ = C * Math.sin(hRad)

  // oklab → LMS (cube root domain)
  const l = L + 0.3963377774 * a_ + 0.2158037573 * b_
  const m = L - 0.1055613458 * a_ - 0.0638541728 * b_
  const s = L - 0.0894841775 * a_ - 1.2914855480 * b_

  // LMS cube root → LMS linear
  const ll = l * l * l
  const mm = m * m * m
  const ss = s * s * s

  // LMS → linear sRGB
  let r = +4.0767416621 * ll - 3.3077115913 * mm + 0.2309699292 * ss
  let g = -1.2684380046 * ll + 2.6097574011 * mm - 0.3413193965 * ss
  let b = -0.0041960863 * ll - 0.7034186147 * mm + 1.7076147010 * ss

  // linear sRGB → sRGB (gamma correction) + clamp
  const toSrgb = (v) => {
    v = Math.max(0, Math.min(1, v))
    return Math.round(
      (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255
    )
  }

  r = toSrgb(r)
  g = toSrgb(g)
  b = toSrgb(b)

  if (alpha < 1) {
    return `rgba(${r}, ${g}, ${b}, ${Math.round(alpha * 1000) / 1000})`
  }
  return `rgb(${r}, ${g}, ${b})`
}

const OKLCH_RE = /oklch\([^)]+\)/g

/**
 * 원본 문서의 모든 oklch를 rgb로 치환하고 복원 함수를 반환
 * - <style> textContent 직접 치환
 * - <link> CSS 파일을 fetch하여 인라인 <style>로 교체
 * - :root CSS 변수 오버라이드
 */
async function patchOklchInDocument() {
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
      el.textContent = text.replace(OKLCH_RE, convert)
      restoreFns.push(() => { el.textContent = original })
    }
  })

  // 2. <link rel="stylesheet"> → raw CSS fetch 후 인라인 <style>로 교체
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
  for (const link of links) {
    try {
      if (!link.href) continue
      const res = await fetch(link.href)
      const rawCss = await res.text()
      if (!rawCss.includes('oklch')) continue

      const fixedCss = rawCss.replace(OKLCH_RE, convert)

      // <link> 제거 후 같은 위치에 <style> 삽입
      const inlineStyle = document.createElement('style')
      inlineStyle.dataset.pdfOklchFix = 'true'
      inlineStyle.textContent = fixedCss
      link.replaceWith(inlineStyle)

      restoreFns.push(() => { inlineStyle.replaceWith(link) })
    } catch (e) {
      // Cross-origin 또는 fetch 실패 - 무시
    }
  }

  // 3. :root CSS 변수를 rgb로 오버라이드
  const root = document.documentElement
  const originalRootStyle = root.getAttribute('style') || ''
  const computed = getComputedStyle(root)
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
  varNames.forEach(v => {
    const raw = computed.getPropertyValue(v).trim()
    if (raw && raw.includes('oklch')) {
      root.style.setProperty(v, convert(raw))
    }
  })

  return function restore() {
    restoreFns.forEach(fn => fn())
    if (originalRootStyle) {
      root.setAttribute('style', originalRootStyle)
    } else {
      root.removeAttribute('style')
    }
  }
}

/**
 * HTML 요소를 PDF로 변환하여 다운로드
 */
export async function downloadElementAsPdf(element, filename = 'guide', options = {}) {
  // PDF 생성 전에 oklch → rgb 치환 (원본 문서 직접 수정, async)
  const restoreOklch = await patchOklchInDocument()

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
    restoreOklch()
  }
}
