import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  X, Upload, Video, FileVideo, Loader2, CheckCircle,
  AlertCircle, History, ExternalLink, Trash2
} from 'lucide-react'

/**
 * 관리자 영상 업로드 모달
 * - 관리자가 크리에이터 대신 영상을 업로드
 * - v1, v2, v3 버전 관리
 * - 크리에이터도 확인 가능
 */
export default function AdminVideoUploadModal({ isOpen, onClose, application, campaign }) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 기존 제출 내역
  const [existingVersions, setExistingVersions] = useState([])

  // 업로드 폼
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [cleanVideoFile, setCleanVideoFile] = useState(null)
  const [cleanVideoUrl, setCleanVideoUrl] = useState('')
  const [title, setTitle] = useState('')
  const [memo, setMemo] = useState('')
  const [uploadMode, setUploadMode] = useState('file') // 'file' or 'url'

  useEffect(() => {
    if (isOpen && application) {
      fetchExistingVersions()
    }
  }, [isOpen, application])

  const fetchExistingVersions = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('video_submissions')
        .select('*')
        .eq('application_id', application.id)
        .eq('video_number', 1)
        .order('version', { ascending: false })

      if (fetchError) throw fetchError
      setExistingVersions(data || [])
    } catch (err) {
      console.error('버전 조회 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  const getNextVersion = () => {
    if (existingVersions.length === 0) return 1
    return (existingVersions[0]?.version || 0) + 1
  }

  const handleFileChange = (type, e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024 * 1024) {
      setError('파일 크기는 2GB 이하여야 합니다.')
      return
    }

    if (!file.type.startsWith('video/')) {
      setError('영상 파일만 업로드 가능합니다.')
      return
    }

    if (type === 'edited') {
      setVideoFile(file)
    } else {
      setCleanVideoFile(file)
    }
    setError('')
  }

  const uploadVideoFile = async (file, type, version) => {
    const fileExt = file.name.split('.').pop()
    const typePrefix = type === 'clean' ? 'clean' : 'edited'
    const filePath = `videos/${application.campaign_id}/${application.user_id || 'admin'}/${typePrefix}_v${version}_admin_${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('video-submissions')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('video-submissions')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  }

  const handleSubmit = async () => {
    // 검증
    if (uploadMode === 'file' && !videoFile) {
      setError('영상 파일을 선택해주세요.')
      return
    }
    if (uploadMode === 'url' && !videoUrl.trim()) {
      setError('영상 URL을 입력해주세요.')
      return
    }

    const nextVersion = getNextVersion()
    if (nextVersion > 10) {
      setError('최대 10개 버전까지 업로드할 수 있습니다.')
      return
    }

    try {
      setUploading(true)
      setError('')
      setSuccess('')
      setUploadProgress(10)

      let editedUrl = videoUrl.trim()
      let cleanUrl = cleanVideoUrl.trim()

      // 파일 업로드 모드
      if (uploadMode === 'file') {
        if (videoFile) {
          setUploadProgress(30)
          editedUrl = await uploadVideoFile(videoFile, 'edited', nextVersion)
        }
        if (cleanVideoFile) {
          setUploadProgress(60)
          cleanUrl = await uploadVideoFile(cleanVideoFile, 'clean', nextVersion)
        }
      }

      setUploadProgress(80)

      // video_submissions 테이블에 삽입
      const submissionData = {
        application_id: application.id,
        campaign_id: application.campaign_id,
        user_id: application.user_id,
        clean_video_url: cleanUrl || null,
        video_file_url: editedUrl,
        sns_title: title || `관리자 업로드 V${nextVersion}`,
        sns_content: memo || null,
        video_number: 1,
        version: nextVersion,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        uploaded_by: 'admin'
      }

      const { error: insertError } = await supabase
        .from('video_submissions')
        .insert([submissionData])

      if (insertError) throw insertError

      // applications 상태 업데이트 (filming → video_submitted)
      const statusesToUpdate = ['approved', 'selected', 'virtual_selected', 'filming']
      if (statusesToUpdate.includes(application.status)) {
        await supabase
          .from('applications')
          .update({
            status: 'video_submitted',
            updated_at: new Date().toISOString()
          })
          .eq('id', application.id)
      }

      setUploadProgress(100)
      setSuccess(`V${nextVersion} 영상이 업로드되었습니다. 크리에이터도 확인할 수 있습니다.`)

      // 리스트 새로고침
      await fetchExistingVersions()

      // 폼 초기화
      setVideoFile(null)
      setVideoUrl('')
      setCleanVideoFile(null)
      setCleanVideoUrl('')
      setTitle('')
      setMemo('')

    } catch (err) {
      console.error('영상 업로드 오류:', err)
      const msg = err.message || ''
      let userMsg = '업로드 실패: '
      if (msg.includes('http_request') || msg.includes('supabase_functions')) {
        userMsg += '서버 설정 오류입니다. 관리자에게 문의해주세요.'
      } else if (msg.includes('row-level security')) {
        userMsg += '권한이 없습니다. 다시 로그인해주세요.'
      } else if (msg.includes('network') || msg.includes('Failed to fetch')) {
        userMsg += '네트워크 오류입니다. 인터넷 연결을 확인해주세요.'
      } else {
        userMsg += msg || '알 수 없는 오류가 발생했습니다.'
      }
      setError(userMsg)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDeleteVersion = async (versionId, versionNum) => {
    if (!confirm(`V${versionNum} 영상을 삭제하시겠습니까?`)) return

    try {
      const { error: deleteError } = await supabase
        .from('video_submissions')
        .delete()
        .eq('id', versionId)

      if (deleteError) throw deleteError

      setSuccess(`V${versionNum} 영상이 삭제되었습니다.`)
      await fetchExistingVersions()
    } catch (err) {
      setError(`삭제 실패: ${err.message}`)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[99999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50 z-[99998]" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto z-[99999]">
          {/* 헤더 */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                관리자 영상 업로드
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {application?.user_name || '크리에이터'} · {campaign?.title || '캠페인'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* 알림 메시지 */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {/* 기존 버전 히스토리 */}
            {existingVersions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                  <History className="h-4 w-4" />
                  제출 내역 ({existingVersions.length}개)
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {existingVersions.map((v) => (
                    <div key={v.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          v.status === 'approved' ? 'bg-green-100 text-green-700' :
                          v.status === 'revision_requested' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          V{v.version}
                        </span>
                        <div>
                          <p className="text-sm text-gray-800">
                            {v.sns_title || `버전 ${v.version}`}
                            {v.uploaded_by === 'admin' && (
                              <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">관리자</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(v.submitted_at || v.created_at).toLocaleDateString('ko-KR')} {new Date(v.submitted_at || v.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {v.video_file_url && (
                          <a
                            href={v.video_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-gray-200 rounded"
                            title="영상 보기"
                          >
                            <ExternalLink className="h-4 w-4 text-blue-600" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteVersion(v.id, v.version)}
                          className="p-1.5 hover:bg-red-100 rounded"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 다음 버전 정보 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                다음 업로드 버전: <span className="font-bold text-blue-900">V{getNextVersion()}</span>
                {existingVersions.length > 0 && (
                  <span className="text-blue-600"> (기존 {existingVersions.length}개 버전)</span>
                )}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                관리자가 업로드한 영상은 크리에이터 지원 내역에서도 확인할 수 있습니다.
              </p>
            </div>

            {/* 업로드 모드 선택 */}
            <div className="flex gap-2">
              <button
                onClick={() => setUploadMode('file')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  uploadMode === 'file'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                파일 업로드
              </button>
              <button
                onClick={() => setUploadMode('url')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  uploadMode === 'url'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                URL 입력
              </button>
            </div>

            {/* 파일 업로드 모드 */}
            {uploadMode === 'file' && (
              <div className="space-y-4">
                {/* 편집본 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    편집본 (필수) *
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileChange('edited', e)}
                      className="hidden"
                    />
                    {videoFile ? (
                      <div className="text-center">
                        <FileVideo className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                        <p className="text-sm font-medium text-blue-700">{videoFile.name}</p>
                        <p className="text-xs text-gray-500">{(videoFile.size / (1024 * 1024)).toFixed(1)}MB</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                        <p className="text-sm text-gray-500">편집본 영상 선택</p>
                        <p className="text-xs text-gray-400">최대 2GB</p>
                      </div>
                    )}
                  </label>
                </div>

                {/* 클린본 (선택) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    클린본 (선택)
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileChange('clean', e)}
                      className="hidden"
                    />
                    {cleanVideoFile ? (
                      <div className="text-center">
                        <p className="text-sm text-gray-700">{cleanVideoFile.name}</p>
                        <p className="text-xs text-gray-500">{(cleanVideoFile.size / (1024 * 1024)).toFixed(1)}MB</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">클린본 영상 선택 (선택사항)</p>
                    )}
                  </label>
                </div>
              </div>
            )}

            {/* URL 입력 모드 */}
            {uploadMode === 'url' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    편집본 URL (필수) *
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://drive.google.com/... 또는 영상 URL"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    클린본 URL (선택)
                  </label>
                  <input
                    type="url"
                    value={cleanVideoUrl}
                    onChange={(e) => setCleanVideoUrl(e.target.value)}
                    placeholder="클린본 URL (선택사항)"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* 제목 + 메모 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                영상 제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`V${getNextVersion()} 영상`}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                메모 (크리에이터에게 전달)
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="크리에이터에게 전달할 메모 (선택사항)"
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {/* 업로드 진행바 */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-700">업로드 중... {uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 하단 버튼 */}
          <div className="sticky bottom-0 bg-white border-t px-6 py-4 rounded-b-2xl flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              닫기
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading || loading}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  V{getNextVersion()} 업로드
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
