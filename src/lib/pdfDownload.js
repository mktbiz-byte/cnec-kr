/**
 * 가이드 콘텐츠를 문서형 PDF로 저장 (텍스트 선택/번역 가능)
 *
 * 브라우저의 인쇄 기능을 활용하여 실제 텍스트가 포함된 PDF 문서를 생성합니다.
 * html2canvas 이미지 방식이 아닌 브라우저 네이티브 렌더링을 사용하므로:
 * - 텍스트 선택/복사/번역 가능
 * - oklch/oklab 등 최신 CSS 색상 함수 네이티브 지원
 * - 고품질 벡터 렌더링
 */

function escapeHtml(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function collectStyles() {
  const items = []

  document.querySelectorAll('style').forEach(el => {
    items.push(el.outerHTML)
  })

  document.querySelectorAll('link[rel="stylesheet"]').forEach(el => {
    const clone = el.cloneNode(true)
    clone.href = el.href
    items.push(clone.outerHTML)
  })

  return items.join('\n')
}

const TYPE_LABELS = {
  planned: '기획형',
  oliveyoung: '올리브영',
  '4week_challenge': '4주 챌린지',
  general: '일반',
}

const CHANNEL_LABELS = {
  instagram: '📸 Instagram',
  youtube: '📺 YouTube',
  tiktok: '🎵 TikTok',
}

/**
 * HTML 요소를 문서형 PDF로 저장
 * 브라우저 인쇄 대화상자에서 "PDF로 저장"을 선택하면 문서형 PDF가 생성됩니다.
 */
export function downloadElementAsPdf(element, filename = '촬영가이드', options = {}) {
  const { brand, campaignTitle, type, channel } = options

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.')
    return
  }

  const styles = collectStyles()
  const contentHtml = element.innerHTML
  const typeBadge = type && TYPE_LABELS[type] ? `<span class="doc-badge">${TYPE_LABELS[type]}</span>` : ''
  const channelBadge = channel ? `<span class="doc-badge">${CHANNEL_LABELS[channel.toLowerCase()] || escapeHtml(channel)}</span>` : ''
  const dateStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  printWindow.document.write(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(filename)}</title>
${styles}
<style>
/* ===== Document PDF Styles ===== */
*, *::before, *::after {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

html, body {
  margin: 0;
  padding: 0;
  background: white !important;
  color: #1a1a1a;
  font-size: 14px;
  line-height: 1.6;
}

body {
  max-width: 680px;
  margin: 0 auto;
  padding: 40px 28px;
}

/* --- Document Header --- */
.doc-header {
  text-align: center;
  padding: 36px 28px 32px;
  margin-bottom: 28px;
  background: linear-gradient(135deg, #7c3aed 0%, #4338ca 100%) !important;
  border-radius: 20px;
  color: white;
}
.doc-header .doc-brand {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.75;
  margin: 0 0 6px;
}
.doc-header h1 {
  font-size: 24px;
  font-weight: 800;
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}
.doc-header .doc-campaign {
  font-size: 15px;
  font-weight: 600;
  opacity: 0.9;
  margin: 0;
}
.doc-header .doc-badges {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}
.doc-header .doc-badge {
  display: inline-block;
  padding: 4px 14px;
  background: rgba(255,255,255,0.18) !important;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

/* --- Content Area --- */
.doc-content {
  overflow: visible !important;
  max-height: none !important;
}
.doc-content > * + * {
  margin-top: 1.5rem;
}
.doc-content > * {
  overflow: visible !important;
}

/* Hide interactive elements in print */
.doc-content button,
.doc-content [role="button"] {
  display: none !important;
}

/* Remove backdrop-blur (doesn't print well) */
.doc-content [class*="backdrop-blur"] {
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
}

/* --- Footer --- */
.doc-footer {
  margin-top: 40px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  font-size: 11px;
  color: #9ca3af;
}

/* --- Print Settings --- */
@page {
  margin: 12mm 10mm;
  size: A4;
}

@media print {
  body { padding: 0; }
  .doc-header { break-after: avoid; }
  .doc-footer { break-before: avoid; }

  /* Avoid breaking inside content cards */
  [class*="rounded-2xl"],
  [class*="rounded-3xl"],
  [class*="rounded-xl"] {
    break-inside: avoid;
  }
}
</style>
</head>
<body>
  <div class="doc-header">
    ${brand ? `<p class="doc-brand">${escapeHtml(brand)}</p>` : ''}
    <h1>촬영 가이드</h1>
    ${campaignTitle ? `<p class="doc-campaign">${escapeHtml(campaignTitle)}</p>` : ''}
    ${typeBadge || channelBadge ? `<div class="doc-badges">${typeBadge}${channelBadge}</div>` : ''}
  </div>

  <div class="doc-content">
    ${contentHtml}
  </div>

  <div class="doc-footer">
    ${dateStr} 생성
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 400);
    });
    window.addEventListener('afterprint', function() {
      window.close();
    });
  </script>
</body>
</html>`)

  printWindow.document.close()
}
