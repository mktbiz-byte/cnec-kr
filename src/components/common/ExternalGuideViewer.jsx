import React from 'react'
import { ExternalLink, Download, FileText, File } from 'lucide-react'

/**
 * 외부 가이드 뷰어 컴포넌트
 * PDF 파일 다운로드/미리보기 또는 Google 문서 URL 열기
 */
const ExternalGuideViewer = ({
  guideType,      // 'pdf' | 'google_docs' | 'google_sheets' | 'google_slides'
  guideUrl,       // Google 문서 URL
  fileUrl,        // PDF 파일 URL (Supabase Storage)
  title,          // 가이드 제목
  fileName,       // 파일명
  className = ''
}) => {
  // Google 문서 타입별 아이콘 및 라벨
  const getGoogleTypeInfo = (type, url) => {
    // URL에서 타입 감지
    if (url) {
      if (url.includes('docs.google.com/document')) {
        return { label: 'Google 문서', color: 'bg-blue-600 hover:bg-blue-700' }
      }
      if (url.includes('docs.google.com/spreadsheets') || url.includes('sheets.google.com')) {
        return { label: 'Google 스프레드시트', color: 'bg-green-600 hover:bg-green-700' }
      }
      if (url.includes('docs.google.com/presentation')) {
        return { label: 'Google 슬라이드', color: 'bg-yellow-600 hover:bg-yellow-700' }
      }
    }
    // 타입으로 감지
    switch (type) {
      case 'google_docs':
        return { label: 'Google 문서', color: 'bg-blue-600 hover:bg-blue-700' }
      case 'google_sheets':
        return { label: 'Google 스프레드시트', color: 'bg-green-600 hover:bg-green-700' }
      case 'google_slides':
        return { label: 'Google 슬라이드', color: 'bg-yellow-600 hover:bg-yellow-700' }
      default:
        return { label: 'Google 문서', color: 'bg-blue-600 hover:bg-blue-700' }
    }
  }

  // URL이 Google 문서인지 확인
  const isGoogleUrl = (url) => {
    if (!url) return false
    return url.includes('docs.google.com') ||
           url.includes('sheets.google.com') ||
           url.includes('drive.google.com')
  }

  // 파일 URL이 있는 경우 (PDF 또는 기타 파일) - 최우선 처리
  if (fileUrl) {
    const isPdf = guideType === 'pdf' || fileName?.toLowerCase().endsWith('.pdf') || fileUrl.toLowerCase().includes('.pdf')
    const displayName = fileName || title || (isPdf ? 'PDF 가이드' : '가이드 파일')

    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 ${isPdf ? 'bg-red-100' : 'bg-blue-100'} rounded-lg flex items-center justify-center`}>
            <FileText size={20} className={isPdf ? 'text-red-600' : 'text-blue-600'} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">
              {title || displayName}
            </p>
            {fileName && (
              <p className="text-xs text-gray-500 truncate">{fileName}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink size={14} />
            미리보기
          </a>
          <a
            href={fileUrl}
            download={fileName || (isPdf ? 'guide.pdf' : 'guide')}
            className={`flex-1 py-2.5 ${isPdf ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2`}
          >
            <Download size={14} />
            다운로드
          </a>
        </div>
      </div>
    )
  }

  // Google 문서인 경우 (guideType으로 지정되거나 URL로 감지)
  if (guideUrl && (guideType?.startsWith('google_') || isGoogleUrl(guideUrl))) {
    const typeInfo = getGoogleTypeInfo(guideType, guideUrl)

    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <File size={20} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">
              {title || typeInfo.label}
            </p>
            <p className="text-xs text-gray-500">{typeInfo.label}</p>
          </div>
        </div>
        <a
          href={guideUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full py-2.5 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${typeInfo.color}`}
        >
          <ExternalLink size={14} />
          {typeInfo.label} 열기
        </a>
      </div>
    )
  }

  // 일반 URL인 경우 (외부 링크)
  if (guideUrl) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
            <ExternalLink size={20} className="text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">
              {title || '외부 가이드'}
            </p>
          </div>
        </div>
        <a
          href={guideUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
        >
          <ExternalLink size={14} />
          링크 열기
        </a>
      </div>
    )
  }

  // 가이드 정보가 없는 경우
  return null
}

export default ExternalGuideViewer
