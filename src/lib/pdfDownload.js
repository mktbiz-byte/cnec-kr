import html2pdf from 'html2pdf.js'

/**
 * oklab/oklch → sRGB 변환 공통 파이프라인
 * oklab(L, a, b) → LMS → linear sRGB → sRGB
 */
function oklabToSrgb(L, a_, b_) {
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

  // linear sRGB → sRGB (gamma correction) + clamp to [0, 255]
  const toSrgb = (v) => {
    v = Math.max(0, Math.min(1, v))
    return Math.round(
      (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255
    )
  }

  return [toSrgb(r), toSrgb(g), toSrgb(b)]
}

function formatRgb(r, g, b, alpha) {
  if (alpha < 1) {
    return `rgba(${r}, ${g}, ${b}, ${Math.round(alpha * 1000) / 1000})`
  }
  return `rgb(${r}, ${g}, ${b})`
}

function parseAlpha(alphaStr) {
  if (!alphaStr || alphaStr === 'none') return 1
  const val = parseFloat(alphaStr)
  return alphaStr.endsWith('%') ? val / 100 : val
}

/**
 * oklch(L C H / alpha) → rgb(r, g, b)
 */
function oklchToRgb(str) {
  const match = str.match(
    /oklch\(\s*([\d.]+%?|none)\s+([\d.]+%?|none)\s+([\d.]+(?:deg)?|none)(?:\s*\/\s*([\d.]+%?|none))?\s*\)/
  )
  if (!match) return 'rgb(0, 0, 0)'

  let L = match[1] === 'none' ? 0 : parseFloat(match[1])
  if (match[1]?.endsWith('%')) L = L / 100

  const C = match[2] === 'none' ? 0 : parseFloat(match[2])
  const H = match[3] === 'none' ? 0 : parseFloat(match[3])
  const alpha = parseAlpha(match[4])

  // oklch → oklab (polar → cartesian)
  const hRad = H * Math.PI / 180
  const a_ = C * Math.cos(hRad)
  const b_ = C * Math.sin(hRad)

  const [r, g, b] = oklabToSrgb(L, a_, b_)
  return formatRgb(r, g, b, alpha)
}

/**
 * oklab(L a b / alpha) → rgb(r, g, b)
 */
function oklabToRgb(str) {
  const match = str.match(
    /oklab\(\s*([\d.]+%?|none)\s+([-\d.]+%?|none)\s+([-\d.]+%?|none)(?:\s*\/\s*([\d.]+%?|none))?\s*\)/
  )
  if (!match) return 'rgb(0, 0, 0)'

  let L = match[1] === 'none' ? 0 : parseFloat(match[1])
  if (match[1]?.endsWith('%')) L = L / 100

  const a_ = match[2] === 'none' ? 0 : parseFloat(match[2])
  const b_ = match[3] === 'none' ? 0 : parseFloat(match[3])
  const alpha = parseAlpha(match[4])

  const [r, g, b] = oklabToSrgb(L, a_, b_)
  return formatRgb(r, g, b, alpha)
}

// oklch(...) 또는 oklab(...) 매칭 (중첩 괄호 없는 경우)
const OK_COLOR_RE = /ok(?:lch|lab)\([^)]+\)/g

function convertOkColor(match) {
  if (match.startsWith('oklch')) return oklchToRgb(match)
  if (match.startsWith('oklab')) return oklabToRgb(match)
  return match
}

/**
 * 원본 문서의 모든 oklch/oklab를 rgb로 치환하고 복원 함수를 반환
 */
async function patchModernColorsInDocument() {
  const cache = new Map()
  const convert = (match) => {
    if (cache.has(match)) return cache.get(match)
    const rgb = convertOkColor(match)
    cache.set(match, rgb)
    return rgb
  }

  const restoreFns = []

  // 1. <style> 요소의 textContent에서 oklch/oklab 치환
  document.querySelectorAll('style').forEach(el => {
    const text = el.textContent
    if (text && (text.includes('oklch') || text.includes('oklab'))) {
      const original = text
      el.textContent = text.replace(OK_COLOR_RE, convert)
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
      if (!rawCss.includes('oklch') && !rawCss.includes('oklab')) continue

      const fixedCss = rawCss.replace(OK_COLOR_RE, convert)

      const inlineStyle = document.createElement('style')
      inlineStyle.dataset.pdfColorFix = 'true'
      inlineStyle.textContent = fixedCss
      link.replaceWith(inlineStyle)

      restoreFns.push(() => { inlineStyle.replaceWith(link) })
    } catch (e) {
      // Cross-origin 또는 fetch 실패
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
    if (raw && (raw.includes('oklch') || raw.includes('oklab'))) {
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
  const restore = await patchModernColorsInDocument()

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
    }

    await html2pdf().set(pdfOptions).from(element).save()
  } finally {
    restore()
  }
}
