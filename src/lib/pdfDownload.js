import html2pdf from 'html2pdf.js'

/**
 * oklab/oklch → sRGB 변환 공통 파이프라인
 */
function oklabToSrgb(L, a_, b_) {
  const l = L + 0.3963377774 * a_ + 0.2158037573 * b_
  const m = L - 0.1055613458 * a_ - 0.0638541728 * b_
  const s = L - 0.0894841775 * a_ - 1.2914855480 * b_

  const ll = l * l * l
  const mm = m * m * m
  const ss = s * s * s

  let r = +4.0767416621 * ll - 3.3077115913 * mm + 0.2309699292 * ss
  let g = -1.2684380046 * ll + 2.6097574011 * mm - 0.3413193965 * ss
  let b = -0.0041960863 * ll - 0.7034186147 * mm + 1.7076147010 * ss

  const clamp = (v) => {
    v = Math.max(0, Math.min(1, v))
    return Math.round(
      (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255
    )
  }

  return [clamp(r), clamp(g), clamp(b)]
}

function fmtRgb(r, g, b, a) {
  return a < 1
    ? `rgba(${r}, ${g}, ${b}, ${Math.round(a * 1000) / 1000})`
    : `rgb(${r}, ${g}, ${b})`
}

function parseA(s) {
  if (!s || s === 'none') return 1
  const v = parseFloat(s)
  return s.endsWith('%') ? v / 100 : v
}

function oklchToRgb(str) {
  const m = str.match(/oklch\(\s*([\d.]+%?|none)\s+([\d.]+%?|none)\s+([\d.]+(?:deg)?|none)(?:\s*\/\s*([\d.]+%?|none))?\s*\)/)
  if (!m) return 'rgb(0,0,0)'
  let L = m[1] === 'none' ? 0 : parseFloat(m[1])
  if (m[1]?.endsWith('%')) L /= 100
  const C = m[2] === 'none' ? 0 : parseFloat(m[2])
  const H = m[3] === 'none' ? 0 : parseFloat(m[3])
  const hRad = H * Math.PI / 180
  const [r, g, b] = oklabToSrgb(L, C * Math.cos(hRad), C * Math.sin(hRad))
  return fmtRgb(r, g, b, parseA(m[4]))
}

function oklabToRgb(str) {
  const m = str.match(/oklab\(\s*([\d.]+%?|none)\s+([-\d.]+%?|none)\s+([-\d.]+%?|none)(?:\s*\/\s*([\d.]+%?|none))?\s*\)/)
  if (!m) return 'rgb(0,0,0)'
  let L = m[1] === 'none' ? 0 : parseFloat(m[1])
  if (m[1]?.endsWith('%')) L /= 100
  const [r, g, b] = oklabToSrgb(L, m[2] === 'none' ? 0 : parseFloat(m[2]), m[3] === 'none' ? 0 : parseFloat(m[3]))
  return fmtRgb(r, g, b, parseA(m[4]))
}

// oklch(...) 또는 oklab(...) 함수 매칭
const OK_FN_RE = /ok(?:lch|lab)\([^)]+\)/g

// 그래디언트 내 "in oklab", "in oklch" 색공간 지정자 제거
const OK_INTERP_RE = /\bin\s+ok(?:lch|lab)\b/g

// color-mix(in oklab/oklch, ...) 매칭 - 중첩 괄호 포함
const COLOR_MIX_RE = /color-mix\(in\s+ok(?:lch|lab)\s*,\s*([^,)]+)\s*(?:(\d+%)\s*)?,\s*([^,)]+)\s*(?:(\d+%)\s*)?\)/g

function convertOkColor(match) {
  if (match.startsWith('oklch')) return oklchToRgb(match)
  if (match.startsWith('oklab')) return oklabToRgb(match)
  return match
}

/**
 * CSS 텍스트에서 모든 oklab/oklch 관련 값을 rgb로 치환
 * 1. oklab(...), oklch(...) 함수 → rgb(...)
 * 2. "in oklab", "in oklch" 그래디언트 색공간 지정자 제거
 * 3. color-mix(in oklab/oklch, ...) → 첫 번째 색상으로 단순화
 */
function fixCssText(text, cache) {
  let result = text
  // 1. oklch/oklab 함수 → rgb
  result = result.replace(OK_FN_RE, (m) => {
    if (cache.has(m)) return cache.get(m)
    const rgb = convertOkColor(m)
    cache.set(m, rgb)
    return rgb
  })
  // 2. "in oklab/oklch" 그래디언트 색공간 제거
  result = result.replace(OK_INTERP_RE, '')
  // 3. color-mix 단순화 (첫 번째 색상 사용)
  result = result.replace(COLOR_MIX_RE, (_, c1) => c1.trim())
  return result
}

/**
 * 클론된 문서의 모든 요소에서 oklab/oklch computed style을 인라인 rgb로 교체
 */
function fixComputedStylesInClone(clonedDoc, cache) {
  const win = clonedDoc.defaultView
  if (!win) return

  const colorProps = [
    'color', 'backgroundColor',
    'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
    'outlineColor', 'textDecorationColor'
  ]
  const cssPropName = (js) => js.replace(/[A-Z]/g, c => '-' + c.toLowerCase())

  clonedDoc.querySelectorAll('*').forEach(el => {
    try {
      const cs = win.getComputedStyle(el)

      // 색상 속성 검사
      colorProps.forEach(prop => {
        const val = cs[prop]
        if (val && (val.includes('oklab') || val.includes('oklch'))) {
          const fixed = val.replace(OK_FN_RE, (m) => {
            if (cache.has(m)) return cache.get(m)
            const rgb = convertOkColor(m)
            cache.set(m, rgb)
            return rgb
          })
          el.style.setProperty(cssPropName(prop), fixed, 'important')
        }
      })

      // background-image (그래디언트)
      const bgImg = cs.backgroundImage
      if (bgImg && bgImg !== 'none' && (bgImg.includes('oklab') || bgImg.includes('oklch'))) {
        let fixed = bgImg.replace(OK_FN_RE, (m) => {
          if (cache.has(m)) return cache.get(m)
          const rgb = convertOkColor(m)
          cache.set(m, rgb)
          return rgb
        })
        fixed = fixed.replace(OK_INTERP_RE, '')
        el.style.setProperty('background-image', fixed, 'important')
      }

      // box-shadow
      const shadow = cs.boxShadow
      if (shadow && shadow !== 'none' && (shadow.includes('oklab') || shadow.includes('oklch'))) {
        const fixed = shadow.replace(OK_FN_RE, (m) => {
          if (cache.has(m)) return cache.get(m)
          const rgb = convertOkColor(m)
          cache.set(m, rgb)
          return rgb
        })
        el.style.setProperty('box-shadow', fixed, 'important')
      }
    } catch (e) {
      // Skip elements that can't be processed
    }
  })
}

/**
 * 원본 문서의 모든 oklch/oklab를 rgb로 치환하고 복원 함수를 반환
 */
async function patchModernColorsInDocument() {
  const cache = new Map()
  const restoreFns = []

  // 1. <style> 요소의 textContent 치환
  document.querySelectorAll('style').forEach(el => {
    const text = el.textContent
    if (text && (text.includes('oklch') || text.includes('oklab'))) {
      const original = text
      el.textContent = fixCssText(text, cache)
      restoreFns.push(() => { el.textContent = original })
    }
  })

  // 2. <link rel="stylesheet"> → fetch raw CSS → 인라인 <style>로 교체
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
  for (const link of links) {
    try {
      if (!link.href) continue
      const res = await fetch(link.href)
      const rawCss = await res.text()
      if (!rawCss.includes('oklch') && !rawCss.includes('oklab')) continue

      const fixedCss = fixCssText(rawCss, cache)
      const inlineStyle = document.createElement('style')
      inlineStyle.dataset.pdfColorFix = 'true'
      inlineStyle.textContent = fixedCss
      link.replaceWith(inlineStyle)
      restoreFns.push(() => { inlineStyle.replaceWith(link) })
    } catch (e) {
      // Cross-origin or fetch failed
    }
  }

  // 3. :root CSS 변수 오버라이드
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
      const fixed = raw.replace(OK_FN_RE, (m) => {
        if (cache.has(m)) return cache.get(m)
        const rgb = convertOkColor(m)
        cache.set(m, rgb)
        return rgb
      })
      root.style.setProperty(v, fixed)
    }
  })

  return { cache, restore: () => {
    restoreFns.forEach(fn => fn())
    if (originalRootStyle) root.setAttribute('style', originalRootStyle)
    else root.removeAttribute('style')
  }}
}

/**
 * HTML 요소를 PDF로 변환하여 다운로드
 */
export async function downloadElementAsPdf(element, filename = 'guide', options = {}) {
  // 1. 원본 문서 CSS 패치
  const { cache, restore } = await patchModernColorsInDocument()

  // 2. 브라우저 스타일 재계산 대기
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

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
        // 3. 클론된 문서에서 남은 oklab/oklch computed style 인라인 rgb로 교체
        onclone: (clonedDoc) => {
          // 3a. 클론된 문서의 <style> 요소도 재치환
          clonedDoc.querySelectorAll('style').forEach(el => {
            const text = el.textContent
            if (text && (text.includes('oklch') || text.includes('oklab'))) {
              el.textContent = fixCssText(text, cache)
            }
          })
          // 3b. 모든 요소의 computed style에서 oklab/oklch → 인라인 rgb
          fixComputedStylesInClone(clonedDoc, cache)
        },
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
