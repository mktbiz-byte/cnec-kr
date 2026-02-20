import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  Sparkles, Youtube, FileText, CheckCircle, Copy, Check,
  Loader2, ArrowLeft, Video, Crown, Play,
  ChevronRight, AlertCircle, Zap, Clock, Film, RefreshCw,
  FolderOpen, Trash2, Eye, Search, TrendingUp, Hash, Image, Tag
} from 'lucide-react'

// MUSE 등급 전용 AI 숏폼 가이드 플랫폼
const CreatorAIGuide = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [isMuse, setIsMuse] = useState(false)
  const [activeTab, setActiveTab] = useState('analyze') // analyze, script, saved, seo

  // 저장된 대본 관련
  const [savedScripts, setSavedScripts] = useState([])
  const [loadingSaved, setLoadingSaved] = useState(false)
  const [selectedSavedScript, setSelectedSavedScript] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  // 숏폼 분석 관련
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)

  // 숏폼 대본 생성 관련
  const [scriptForm, setScriptForm] = useState({
    brandName: '',
    brandInfo: '',
    storyConcept: '',
    targetAudience: '',
    duration: '30초',
    additionalNotes: ''
  })
  const [generatingScript, setGeneratingScript] = useState(false)
  const [scriptResult, setScriptResult] = useState(null)

  // 검증 관련
  const [verifying, setVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState(null)

  // 재생성 관련
  const [regenerating, setRegenerating] = useState(false)
  const [scriptVersion, setScriptVersion] = useState(1)

  // SEO 관련
  const [seoForm, setSeoForm] = useState({
    keyword: '',
    category: '',
    platform: 'YouTube Shorts',
    contentType: '숏폼'
  })
  const [analyzingSeo, setAnalyzingSeo] = useState(false)
  const [seoResult, setSeoResult] = useState(null)

  // 복사 상태
  const [copiedId, setCopiedId] = useState(null)

  // 에러/성공 메시지
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) {
      checkMuseAccess()
    }
  }, [user])

  const checkMuseAccess = async () => {
    try {
      setLoading(true)

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      setProfile(profileData)

      // MUSE 등급 체크 (grade가 5이면 MUSE)
      const isMuseGrade = profileData?.cnec_grade_level === 5
      setIsMuse(isMuseGrade)

      // MUSE면 저장된 대본 로드
      if (isMuseGrade) {
        loadSavedScripts()
      }

    } catch (error) {
      console.error('접근 권한 확인 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 저장된 대본 로드
  const loadSavedScripts = async () => {
    try {
      setLoadingSaved(true)
      const { data, error } = await supabase
        .from('ai_scripts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setSavedScripts(data || [])
    } catch (error) {
      console.error('저장된 대본 로드 오류:', error)
    } finally {
      setLoadingSaved(false)
    }
  }

  // 대본 삭제
  const handleDeleteScript = async (scriptId) => {
    if (!confirm('이 대본을 삭제하시겠습니까?')) return

    try {
      setDeletingId(scriptId)
      const { error } = await supabase
        .from('ai_scripts')
        .delete()
        .eq('id', scriptId)
        .eq('user_id', user.id)

      if (error) throw error

      setSavedScripts(prev => prev.filter(s => s.id !== scriptId))
      setSuccess('대본이 삭제되었습니다.')
      setTimeout(() => setSuccess(''), 3000)

      // 선택된 대본이 삭제된 경우 초기화
      if (selectedSavedScript?.id === scriptId) {
        setSelectedSavedScript(null)
      }
    } catch (error) {
      console.error('대본 삭제 오류:', error)
      setError('대본 삭제에 실패했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  // 저장된 대본 불러오기
  const handleLoadScript = (script) => {
    setSelectedSavedScript(script)
    setScriptResult(script.generated_script)
    setScriptForm({
      brandName: script.brand_name || '',
      brandInfo: script.brand_info || '',
      storyConcept: script.story_concept || '',
      targetAudience: script.target_audience || '',
      duration: '30초',
      additionalNotes: script.additional_notes || ''
    })
    setVerificationResult(null)
    setActiveTab('script')
    setSuccess('대본을 불러왔습니다.')
    setTimeout(() => setSuccess(''), 3000)
  }

  // 숏폼 분석
  const handleShortFormAnalysis = async () => {
    if (!youtubeUrl.trim()) {
      setError('유튜브 Shorts URL을 입력해주세요.')
      return
    }

    try {
      setAnalyzing(true)
      setError('')
      setAnalysisResult(null)

      const response = await fetch('/.netlify/functions/ai-youtube-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || '분석에 실패했습니다.')
      }

      setAnalysisResult(data.analysis)

      // DB에 저장
      await supabase.from('ai_guides').insert({
        user_id: user.id,
        guide_type: 'shorts_analysis',
        input_data: { youtubeUrl, videoId: data.videoId },
        result: data.analysis
      })

      setSuccess('숏폼 영상 분석이 완료되었습니다!')
      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      console.error('분석 오류:', error)
      setError(error.message || '분석 중 오류가 발생했습니다.')
    } finally {
      setAnalyzing(false)
    }
  }

  // 숏폼 대본 생성
  const handleScriptGeneration = async () => {
    if (!scriptForm.brandName.trim() || !scriptForm.storyConcept.trim()) {
      setError('브랜드명과 스토리 컨셉을 입력해주세요.')
      return
    }

    try {
      setGeneratingScript(true)
      setError('')
      setScriptResult(null)
      setVerificationResult(null)

      const response = await fetch('/.netlify/functions/ai-script-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scriptForm,
          videoLength: scriptForm.duration // 숏폼용 길이
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || '대본 생성에 실패했습니다.')
      }

      setScriptResult(data.script)

      // DB에 저장
      await supabase.from('ai_scripts').insert({
        user_id: user.id,
        brand_name: scriptForm.brandName,
        brand_info: scriptForm.brandInfo,
        story_concept: scriptForm.storyConcept,
        target_audience: scriptForm.targetAudience,
        additional_notes: scriptForm.additionalNotes,
        generated_script: data.script
      })

      setSuccess('숏폼 대본이 생성되었습니다!')
      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      console.error('대본 생성 오류:', error)
      setError(error.message || '대본 생성 중 오류가 발생했습니다.')
    } finally {
      setGeneratingScript(false)
    }
  }

  // 대본 검증
  const handleScriptVerification = async () => {
    if (!scriptResult) {
      setError('먼저 대본을 생성해주세요.')
      return
    }

    try {
      setVerifying(true)
      setError('')

      const response = await fetch('/.netlify/functions/ai-script-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: scriptResult,
          brandName: scriptForm.brandName,
          brandInfo: scriptForm.brandInfo,
          targetAudience: scriptForm.targetAudience
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || '검증에 실패했습니다.')
      }

      setVerificationResult(data.verification)
      setSuccess('대본 검증이 완료되었습니다!')
      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      console.error('검증 오류:', error)
      setError(error.message || '검증 중 오류가 발생했습니다.')
    } finally {
      setVerifying(false)
    }
  }

  // 피드백 반영하여 대본 재생성
  const handleRegenerateWithFeedback = async () => {
    if (!verificationResult) {
      setError('검증 결과가 없습니다.')
      return
    }

    try {
      setRegenerating(true)
      setError('')

      // 검증 피드백을 추가 요청사항에 포함
      const feedbackNotes = []

      if (verificationResult.improvementSuggestions) {
        verificationResult.improvementSuggestions.forEach(item => {
          const suggestion = item.suggested || item.area || item
          if (suggestion) feedbackNotes.push(suggestion)
        })
      }

      if (verificationResult.riskAssessment) {
        verificationResult.riskAssessment.forEach(risk => {
          if (risk.suggestion) feedbackNotes.push(risk.suggestion)
        })
      }

      const improvedNotes = `[이전 대본 개선사항 반영] ${feedbackNotes.join('. ')}. ${scriptForm.additionalNotes || ''}`

      const response = await fetch('/.netlify/functions/ai-script-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scriptForm,
          videoLength: scriptForm.duration,
          additionalNotes: improvedNotes,
          previousScript: scriptResult,
          improvementFeedback: verificationResult
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || '대본 재생성에 실패했습니다.')
      }

      setScriptResult(data.script)
      setVerificationResult(null) // 검증 결과 초기화
      setScriptVersion(prev => prev + 1)

      // DB에 저장
      await supabase.from('ai_scripts').insert({
        user_id: user.id,
        brand_name: scriptForm.brandName,
        brand_info: scriptForm.brandInfo,
        story_concept: scriptForm.storyConcept,
        target_audience: scriptForm.targetAudience,
        additional_notes: improvedNotes,
        generated_script: data.script
      })

      setSuccess(`대본 v${scriptVersion + 1}이 생성되었습니다! 피드백이 반영되었습니다.`)
      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      console.error('대본 재생성 오류:', error)
      setError(error.message || '대본 재생성 중 오류가 발생했습니다.')
    } finally {
      setRegenerating(false)
    }
  }

  // YouTube SEO 분석
  const handleSeoAnalysis = async () => {
    if (!seoForm.keyword.trim()) {
      setError('키워드 또는 주제를 입력해주세요.')
      return
    }

    try {
      setAnalyzingSeo(true)
      setError('')
      setSeoResult(null)

      const response = await fetch('/.netlify/functions/ai-youtube-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seoForm)
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'SEO 분석에 실패했습니다.')
      }

      setSeoResult(data.seo)

      // DB에 저장
      await supabase.from('ai_guides').insert({
        user_id: user.id,
        guide_type: 'youtube_seo',
        input_data: seoForm,
        result: data.seo
      })

      setSuccess('YouTube SEO 분석이 완료되었습니다!')
      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      console.error('SEO 분석 오류:', error)
      setError(error.message || 'SEO 분석 중 오류가 발생했습니다.')
    } finally {
      setAnalyzingSeo(false)
    }
  }

  // 복사 기능
  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('복사 실패:', error)
    }
  }

  // 전체 대본 복사
  const copyFullScript = async () => {
    if (!scriptResult) return

    let fullText = `[${scriptResult.title || '숏폼 대본'}]\n\n`

    if (scriptResult.hook) {
      const hookText = typeof scriptResult.hook === 'string'
        ? scriptResult.hook
        : scriptResult.hook?.text || ''
      fullText += `🎬 훅 (첫 3초):\n${hookText}\n`
      if (typeof scriptResult.hook === 'object' && scriptResult.hook?.visualAction) {
        fullText += `📍 ${scriptResult.hook.visualAction}\n`
      }
      fullText += `\n`
    }

    if (scriptResult.scenes) {
      fullText += `📝 장면별 대본:\n\n`
      scriptResult.scenes.forEach((scene, idx) => {
        fullText += `--- ${scene.sceneTitle || `장면 ${idx + 1}`} (${scene.duration || ''}) ---\n`
        if (scene.dialogue) fullText += `🎤 ${scene.dialogue}\n`
        if (scene.action) fullText += `📍 ${scene.action}\n`
        if (scene.tone) fullText += `🎭 톤: ${scene.tone}\n`
        if (scene.cameraWork) fullText += `🎥 ${scene.cameraWork}\n`
        fullText += `\n`
      })
    }

    if (scriptResult.callToAction) {
      const ctaText = typeof scriptResult.callToAction === 'string'
        ? scriptResult.callToAction
        : scriptResult.callToAction?.text || ''
      fullText += `📢 CTA:\n${ctaText}\n\n`
    }

    if (scriptResult.hashtags) {
      fullText += `#️⃣ 해시태그: ${scriptResult.hashtags.join(' ')}\n`
    }

    await copyToClipboard(fullText, 'full-script')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  // MUSE 등급이 아닌 경우
  if (!isMuse) {
    return (
      <div className="px-5 pt-5 pb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 mb-6"
        >
          <ArrowLeft size={20} />
          <span>뒤로가기</span>
        </button>

        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 text-white text-center mb-6">
          <Crown size={48} className="mx-auto mb-3 opacity-80" />
          <h1 className="text-xl font-bold mb-2">MUSE 전용 기능</h1>
          <p className="text-white/80 text-sm">
            이 기능은 MUSE 등급 크리에이터만 이용할 수 있습니다.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3">🌟 MUSE 혜택</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <Zap size={16} className="text-amber-500" />
              AI 숏폼 분석 무제한
            </li>
            <li className="flex items-center gap-2">
              <Film size={16} className="text-amber-500" />
              숏폼 대본 자동 생성
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={16} className="text-amber-500" />
              콘텐츠 사전 검증
            </li>
            <li className="flex items-center gap-2">
              <Search size={16} className="text-amber-500" />
              YouTube SEO 최적화
            </li>
          </ul>
          <button
            onClick={() => navigate('/my/grade')}
            className="mt-4 w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-1"
          >
            내 등급 확인하기
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 pt-5 pb-8">
      {/* 헤더 카드 */}
      <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 text-white shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-1 -ml-1 text-white/80 hover:text-white"
            >
              <ArrowLeft size={22} />
            </button>
            <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full">
              <Crown size={14} />
              <span className="text-xs font-bold">MUSE</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-white/70" />
            <span className="text-sm font-medium text-white/70">AI Creator Tools</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">숏폼 AI 가이드</h1>
          <p className="text-sm text-white/70">Shorts · Reels · TikTok 최적화</p>
        </div>
      </div>

      {/* 알림 메시지 */}
      {(error || success) && (
        <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${
          error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {error || success}
        </div>
      )}

      {/* 탭 버튼 */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <button
          onClick={() => setActiveTab('analyze')}
          className={`p-3 rounded-2xl text-left transition-all ${
            activeTab === 'analyze'
              ? 'bg-red-500 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-100 shadow-sm'
          }`}
        >
          <Youtube size={20} className={activeTab === 'analyze' ? 'text-white' : 'text-red-500'} />
          <p className="font-bold mt-1.5 text-sm">분석</p>
        </button>

        <button
          onClick={() => setActiveTab('script')}
          className={`p-3 rounded-2xl text-left transition-all ${
            activeTab === 'script'
              ? 'bg-amber-500 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-100 shadow-sm'
          }`}
        >
          <FileText size={20} className={activeTab === 'script' ? 'text-white' : 'text-amber-500'} />
          <p className="font-bold mt-1.5 text-sm">대본</p>
        </button>

        <button
          onClick={() => setActiveTab('seo')}
          className={`p-3 rounded-2xl text-left transition-all ${
            activeTab === 'seo'
              ? 'bg-emerald-500 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-100 shadow-sm'
          }`}
        >
          <Search size={20} className={activeTab === 'seo' ? 'text-white' : 'text-emerald-500'} />
          <p className="font-bold mt-1.5 text-sm">SEO</p>
        </button>

        <button
          onClick={() => { setActiveTab('saved'); loadSavedScripts(); }}
          className={`p-3 rounded-2xl text-left transition-all ${
            activeTab === 'saved'
              ? 'bg-violet-500 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-100 shadow-sm'
          }`}
        >
          <FolderOpen size={20} className={activeTab === 'saved' ? 'text-white' : 'text-violet-500'} />
          <p className="font-bold mt-1.5 text-sm">저장됨</p>
          {savedScripts.length > 0 && (
            <span className={`text-xs ${activeTab === 'saved' ? 'text-white/70' : 'text-gray-400'}`}>
              {savedScripts.length}개
            </span>
          )}
        </button>
      </div>

      {/* 숏폼 분석 탭 */}
      {activeTab === 'analyze' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Play size={20} className="text-red-500" />
              <h2 className="font-bold text-gray-900">YouTube Shorts 분석</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              숏폼 URL을 입력하면 AI가 성공 요인을 분석합니다.
            </p>

            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/shorts/..."
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
            />

            <button
              onClick={handleShortFormAnalysis}
              disabled={analyzing}
              className="w-full py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Zap size={18} />
                  숏폼 분석하기
                </>
              )}
            </button>
          </div>

          {/* 분석 결과 */}
          {analysisResult && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">분석 결과</h3>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(analysisResult, null, 2), 'analysis')}
                  className="text-sm text-red-500 flex items-center gap-1"
                >
                  {copiedId === 'analysis' ? <Check size={16} /> : <Copy size={16} />}
                  {copiedId === 'analysis' ? '복사됨' : '복사'}
                </button>
              </div>

              <div className="space-y-3">
                {analysisResult.estimatedTopic && (
                  <div className="bg-red-50 rounded-xl p-3">
                    <p className="text-xs text-red-600 font-medium mb-1">📌 주제</p>
                    <p className="text-sm text-gray-800">{analysisResult.estimatedTopic}</p>
                  </div>
                )}

                {analysisResult.hookAnalysis && (
                  <div className="bg-amber-50 rounded-xl p-3">
                    <p className="text-xs text-amber-600 font-medium mb-1">🎣 훅 분석</p>
                    <p className="text-sm text-gray-800">{analysisResult.hookAnalysis}</p>
                  </div>
                )}

                {analysisResult.successFactors && (
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-xs text-green-600 font-medium mb-2">✅ 성공 요인</p>
                    <ul className="space-y-1">
                      {analysisResult.successFactors.slice(0, 5).map((factor, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-500">•</span>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.benchmarkPoints && (
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-xs text-blue-600 font-medium mb-2">💡 벤치마킹 포인트</p>
                    <ul className="space-y-1">
                      {analysisResult.benchmarkPoints.slice(0, 5).map((point, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.summary && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 font-medium mb-1">📋 요약</p>
                    <p className="text-sm text-gray-700">{analysisResult.summary}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 대본 생성 탭 */}
      {activeTab === 'script' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Video size={20} className="text-amber-500" />
              <h2 className="font-bold text-gray-900">숏폼 대본 생성</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              브랜드 정보를 입력하면 15~60초 숏폼 대본을 생성합니다.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">브랜드명 *</label>
                <input
                  type="text"
                  value={scriptForm.brandName}
                  onChange={(e) => setScriptForm({...scriptForm, brandName: e.target.value})}
                  placeholder="예: 설화수, 이니스프리"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">제품/브랜드 정보</label>
                <textarea
                  value={scriptForm.brandInfo}
                  onChange={(e) => setScriptForm({...scriptForm, brandInfo: e.target.value})}
                  placeholder="제품 특징, 핵심 메시지, 강조 포인트"
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">스토리 컨셉 *</label>
                <select
                  value={scriptForm.storyConcept}
                  onChange={(e) => setScriptForm({...scriptForm, storyConcept: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">컨셉 선택</option>
                  <option value="유머/밈">유머/밈 스타일</option>
                  <option value="비포애프터">비포&애프터</option>
                  <option value="GRWM">GRWM (겟레디윗미)</option>
                  <option value="언박싱">언박싱/첫인상</option>
                  <option value="꿀팁">꿀팁/정보 공유</option>
                  <option value="일상">일상 브이로그</option>
                  <option value="챌린지">챌린지/트렌드</option>
                  <option value="리뷰">솔직 리뷰</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">영상 길이</label>
                  <select
                    value={scriptForm.duration}
                    onChange={(e) => setScriptForm({...scriptForm, duration: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="15초">15초</option>
                    <option value="30초">30초</option>
                    <option value="45초">45초</option>
                    <option value="60초">60초</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">타겟층</label>
                  <input
                    type="text"
                    value={scriptForm.targetAudience}
                    onChange={(e) => setScriptForm({...scriptForm, targetAudience: e.target.value})}
                    placeholder="예: 20대 여성"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">추가 요청</label>
                <input
                  type="text"
                  value={scriptForm.additionalNotes}
                  onChange={(e) => setScriptForm({...scriptForm, additionalNotes: e.target.value})}
                  placeholder="특별히 포함/제외할 내용"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={handleScriptGeneration}
                disabled={generatingScript}
                className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {generatingScript ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    대본 생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    숏폼 대본 생성
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 생성된 대본 */}
          {scriptResult && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">{scriptResult.title || '숏폼 대본'}</h3>
                  {scriptResult.totalDuration && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock size={12} />
                      {scriptResult.totalDuration}
                    </p>
                  )}
                </div>
                <button
                  onClick={copyFullScript}
                  className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  {copiedId === 'full-script' ? <Check size={14} /> : <Copy size={14} />}
                  {copiedId === 'full-script' ? '복사됨' : '전체 복사'}
                </button>
              </div>

              {/* 훅 */}
              {scriptResult.hook && (
                <div className="bg-red-50 rounded-xl p-3 mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-red-600 font-bold">🎬 훅 (첫 3초)</p>
                    <button
                      onClick={() => copyToClipboard(
                        typeof scriptResult.hook === 'string' ? scriptResult.hook : scriptResult.hook?.text || '',
                        'hook'
                      )}
                      className="text-red-400 hover:text-red-600"
                    >
                      {copiedId === 'hook' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">
                    {typeof scriptResult.hook === 'string' ? scriptResult.hook : scriptResult.hook?.text || ''}
                  </p>
                  {typeof scriptResult.hook === 'object' && scriptResult.hook?.visualAction && (
                    <p className="text-xs text-gray-500 mt-1">📍 {scriptResult.hook.visualAction}</p>
                  )}
                  {typeof scriptResult.hook === 'object' && scriptResult.hook?.hookType && (
                    <span className="inline-block text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full mt-1">
                      {scriptResult.hook.hookType}
                    </span>
                  )}
                </div>
              )}

              {/* 장면 */}
              {scriptResult.scenes && (
                <div className="space-y-2 mb-3">
                  {scriptResult.scenes.map((scene, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-600">
                          {scene.sceneTitle || `장면 ${idx + 1}`}
                          {scene.duration && <span className="font-normal text-gray-400 ml-1">({scene.duration})</span>}
                        </span>
                        <button
                          onClick={() => copyToClipboard(scene.dialogue || scene.action || '', `scene-${idx}`)}
                          className="text-gray-400 hover:text-amber-500"
                        >
                          {copiedId === `scene-${idx}` ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                      {scene.dialogue && (
                        <p className="text-sm text-gray-800">🎤 {scene.dialogue}</p>
                      )}
                      {scene.tone && (
                        <span className="inline-block text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full mt-1 mr-1">
                          {scene.tone}
                        </span>
                      )}
                      {scene.action && (
                        <p className="text-xs text-gray-500 mt-1">📍 {scene.action}</p>
                      )}
                      {scene.cameraWork && (
                        <p className="text-xs text-blue-500 mt-0.5">🎥 {scene.cameraWork}</p>
                      )}
                      {scene.textOverlay && (
                        <p className="text-xs text-purple-500 mt-0.5">💬 자막: {scene.textOverlay}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* CTA */}
              {scriptResult.callToAction && (
                <div className="bg-green-50 rounded-xl p-3 mb-3">
                  <p className="text-xs text-green-600 font-bold mb-1">📢 CTA</p>
                  <p className="text-sm text-gray-800">
                    {typeof scriptResult.callToAction === 'string'
                      ? scriptResult.callToAction
                      : scriptResult.callToAction?.text || ''}
                  </p>
                  {typeof scriptResult.callToAction === 'object' && scriptResult.callToAction?.visualCue && (
                    <p className="text-xs text-gray-500 mt-1">📍 {scriptResult.callToAction.visualCue}</p>
                  )}
                </div>
              )}

              {/* 해시태그 */}
              {scriptResult.hashtags && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {scriptResult.hashtags.map((tag, idx) => (
                    <button
                      key={idx}
                      onClick={() => copyToClipboard(tag.startsWith('#') ? tag : `#${tag}`, `tag-${idx}`)}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-amber-100 hover:text-amber-700"
                    >
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </button>
                  ))}
                </div>
              )}

              {/* 검증 버튼 */}
              <button
                onClick={handleScriptVerification}
                disabled={verifying}
                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    검증 중...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    대본 검증하기
                  </>
                )}
              </button>
            </div>
          )}

          {/* 검증 결과 */}
          {verificationResult && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">검증 결과</h3>
                  {scriptVersion > 1 && (
                    <span className="text-xs text-gray-400">v{scriptVersion}</span>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  verificationResult.overallScore >= 85
                    ? 'bg-green-100 text-green-700'
                    : verificationResult.overallScore >= 70
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {verificationResult.overallScore >= 85 ? '우수' : verificationResult.overallScore >= 70 ? '양호' : '개선필요'}
                </span>
              </div>

              {verificationResult.overallScore && (
                <div className="text-center py-3 mb-3">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${
                    verificationResult.overallScore >= 85
                      ? 'from-emerald-400 to-teal-500'
                      : verificationResult.overallScore >= 70
                      ? 'from-amber-400 to-orange-500'
                      : 'from-red-400 to-rose-500'
                  }`}>
                    <span className="text-2xl font-bold text-white">
                      {verificationResult.overallScore}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">종합 점수</p>
                  {verificationResult.overallScore < 85 && (
                    <p className="text-xs text-amber-600 mt-1">
                      85점 이상이면 최적의 숏폼입니다!
                    </p>
                  )}
                </div>
              )}

              {verificationResult.strengths && (
                <div className="bg-green-50 rounded-xl p-3 mb-3">
                  <p className="text-xs text-green-600 font-bold mb-1">✅ 강점</p>
                  <ul className="space-y-0.5">
                    {verificationResult.strengths.slice(0, 3).map((s, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {verificationResult.improvementSuggestions && verificationResult.improvementSuggestions.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-3 mb-4">
                  <p className="text-xs text-blue-600 font-bold mb-1">💡 개선 제안</p>
                  <ul className="space-y-0.5">
                    {verificationResult.improvementSuggestions.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {item.suggested || item.area || item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 피드백 반영 재생성 버튼 - 점수가 85 미만일 때만 표시 */}
              {verificationResult.overallScore < 85 && (
                <button
                  onClick={handleRegenerateWithFeedback}
                  disabled={regenerating}
                  className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold text-sm hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                  {regenerating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      피드백 반영 중...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      피드백 반영하여 재생성
                    </>
                  )}
                </button>
              )}

              {/* 점수가 85 이상이면 축하 메시지 */}
              {verificationResult.overallScore >= 85 && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 text-center">
                  <p className="text-emerald-700 font-bold text-sm">🎉 훌륭한 대본입니다!</p>
                  <p className="text-emerald-600 text-xs mt-1">이대로 촬영하시면 됩니다</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SEO 탭 */}
      {activeTab === 'seo' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={20} className="text-emerald-500" />
              <h2 className="font-bold text-gray-900">YouTube SEO 추천</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              키워드를 입력하면 AI가 검색 노출 최적화 전략을 추천합니다.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">키워드/주제 *</label>
                <input
                  type="text"
                  value={seoForm.keyword}
                  onChange={(e) => setSeoForm({...seoForm, keyword: e.target.value})}
                  placeholder="예: 올리브영 추천템, 다이어트 식단"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">카테고리</label>
                  <select
                    value={seoForm.category}
                    onChange={(e) => setSeoForm({...seoForm, category: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">선택</option>
                    <option value="뷰티">뷰티</option>
                    <option value="패션">패션</option>
                    <option value="먹방/요리">먹방/요리</option>
                    <option value="브이로그">브이로그</option>
                    <option value="리뷰">리뷰</option>
                    <option value="정보/꿀팁">정보/꿀팁</option>
                    <option value="운동/건강">운동/건강</option>
                    <option value="일상">일상</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">플랫폼</label>
                  <select
                    value={seoForm.platform}
                    onChange={(e) => setSeoForm({...seoForm, platform: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="YouTube Shorts">YouTube Shorts</option>
                    <option value="YouTube 일반">YouTube 일반</option>
                    <option value="Instagram Reels">Instagram Reels</option>
                    <option value="TikTok">TikTok</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSeoAnalysis}
                disabled={analyzingSeo}
                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
              >
                {analyzingSeo ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    SEO 분석 중...
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    SEO 분석하기
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SEO 분석 결과 */}
          {seoResult && (
            <div className="space-y-4">
              {/* 경쟁 분석 요약 */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">SEO 분석 결과</h3>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(seoResult, null, 2), 'seo-all')}
                    className="text-sm text-emerald-500 flex items-center gap-1"
                  >
                    {copiedId === 'seo-all' ? <Check size={16} /> : <Copy size={16} />}
                    {copiedId === 'seo-all' ? '복사됨' : '전체 복사'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-emerald-600 font-medium mb-1">경쟁 강도</p>
                    <p className={`text-lg font-bold ${
                      seoResult.competitionLevel === '높음' ? 'text-red-600' :
                      seoResult.competitionLevel === '보통' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {seoResult.competitionLevel || '-'}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-blue-600 font-medium mb-1">검색량 추세</p>
                    <p className={`text-lg font-bold ${
                      seoResult.searchVolumeTrend === '상승' ? 'text-emerald-600' :
                      seoResult.searchVolumeTrend === '하락' ? 'text-red-600' : 'text-amber-600'
                    }`}>
                      {seoResult.searchVolumeTrend === '상승' ? '↑ ' : seoResult.searchVolumeTrend === '하락' ? '↓ ' : '→ '}
                      {seoResult.searchVolumeTrend || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 제목 추천 */}
              {seoResult.titles && seoResult.titles.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={18} className="text-red-500" />
                    <h3 className="font-bold text-gray-900">제목 추천</h3>
                  </div>
                  <div className="space-y-3">
                    {seoResult.titles.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-gray-900 flex-1">{item.title}</p>
                          <button
                            onClick={() => copyToClipboard(item.title, `title-${idx}`)}
                            className="text-gray-400 hover:text-emerald-500 shrink-0"
                          >
                            {copiedId === `title-${idx}` ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{item.pattern}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            item.estimatedCTR === '상' ? 'bg-emerald-100 text-emerald-700' :
                            item.estimatedCTR === '중' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            CTR {item.estimatedCTR}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 설명문 템플릿 */}
              {seoResult.description && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-amber-500" />
                      <h3 className="font-bold text-gray-900">설명문 템플릿</h3>
                    </div>
                    <button
                      onClick={() => copyToClipboard(seoResult.description.template, 'desc')}
                      className="text-sm text-emerald-500 flex items-center gap-1"
                    >
                      {copiedId === 'desc' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedId === 'desc' ? '복사됨' : '복사'}
                    </button>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 mb-3">
                    <p className="text-sm text-gray-800 whitespace-pre-line">{seoResult.description.template}</p>
                  </div>
                  {seoResult.description.mustInclude && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">필수 포함 요소:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {seoResult.description.mustInclude.map((item, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">{item}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 태그/키워드 */}
              {seoResult.tags && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Tag size={18} className="text-blue-500" />
                      <h3 className="font-bold text-gray-900">태그/키워드</h3>
                    </div>
                    <button
                      onClick={() => {
                        const allTags = [
                          ...(seoResult.tags.primary || []),
                          ...(seoResult.tags.longTail || []),
                          ...(seoResult.tags.related || []),
                          ...(seoResult.tags.trending || [])
                        ].join(', ')
                        copyToClipboard(allTags, 'tags-all')
                      }}
                      className="text-sm text-emerald-500 flex items-center gap-1"
                    >
                      {copiedId === 'tags-all' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedId === 'tags-all' ? '복사됨' : '전체 복사'}
                    </button>
                  </div>

                  {seoResult.tags.primary && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-red-600 mb-1.5">메인 키워드</p>
                      <div className="flex flex-wrap gap-1.5">
                        {seoResult.tags.primary.map((tag, idx) => (
                          <button
                            key={idx}
                            onClick={() => copyToClipboard(tag, `ptag-${idx}`)}
                            className="text-xs px-2.5 py-1 bg-red-50 text-red-700 rounded-full hover:bg-red-100"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {seoResult.tags.longTail && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-blue-600 mb-1.5">롱테일 키워드</p>
                      <div className="flex flex-wrap gap-1.5">
                        {seoResult.tags.longTail.map((tag, idx) => (
                          <button
                            key={idx}
                            onClick={() => copyToClipboard(tag, `ltag-${idx}`)}
                            className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {seoResult.tags.trending && (
                    <div>
                      <p className="text-xs font-semibold text-purple-600 mb-1.5">트렌딩 키워드</p>
                      <div className="flex flex-wrap gap-1.5">
                        {seoResult.tags.trending.map((tag, idx) => (
                          <button
                            key={idx}
                            onClick={() => copyToClipboard(tag, `ttag-${idx}`)}
                            className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 해시태그 */}
              {seoResult.hashtags && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Hash size={18} className="text-violet-500" />
                      <h3 className="font-bold text-gray-900">해시태그</h3>
                    </div>
                    <button
                      onClick={() => {
                        const allHashtags = [
                          ...(seoResult.hashtags.must || []),
                          ...(seoResult.hashtags.recommended || []),
                          ...(seoResult.hashtags.niche || [])
                        ].join(' ')
                        copyToClipboard(allHashtags, 'hashtags-all')
                      }}
                      className="text-sm text-emerald-500 flex items-center gap-1"
                    >
                      {copiedId === 'hashtags-all' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedId === 'hashtags-all' ? '복사됨' : '전체 복사'}
                    </button>
                  </div>

                  {seoResult.hashtags.must && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-red-600 mb-1.5">필수</p>
                      <div className="flex flex-wrap gap-1.5">
                        {seoResult.hashtags.must.map((tag, idx) => (
                          <button
                            key={idx}
                            onClick={() => copyToClipboard(tag, `mhash-${idx}`)}
                            className="text-xs px-2.5 py-1 bg-red-50 text-red-700 rounded-full hover:bg-red-100 font-medium"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {seoResult.hashtags.recommended && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-emerald-600 mb-1.5">추천</p>
                      <div className="flex flex-wrap gap-1.5">
                        {seoResult.hashtags.recommended.map((tag, idx) => (
                          <button
                            key={idx}
                            onClick={() => copyToClipboard(tag, `rhash-${idx}`)}
                            className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full hover:bg-emerald-100"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {seoResult.hashtags.niche && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1.5">틈새</p>
                      <div className="flex flex-wrap gap-1.5">
                        {seoResult.hashtags.niche.map((tag, idx) => (
                          <button
                            key={idx}
                            onClick={() => copyToClipboard(tag, `nhash-${idx}`)}
                            className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 썸네일 전략 */}
              {seoResult.thumbnail && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Image size={18} className="text-pink-500" />
                    <h3 className="font-bold text-gray-900">썸네일 전략</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-pink-50 rounded-xl p-3">
                      <p className="text-xs text-pink-600 font-medium mb-1">스타일</p>
                      <p className="text-sm text-gray-800">{seoResult.thumbnail.style}</p>
                    </div>
                    {seoResult.thumbnail.mainText && (
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 font-medium mb-1">텍스트</p>
                        <p className="text-sm font-bold text-gray-900">{seoResult.thumbnail.mainText}</p>
                      </div>
                    )}
                    {seoResult.thumbnail.colorScheme && (
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 font-medium mb-1">색상</p>
                        <p className="text-sm text-gray-800">{seoResult.thumbnail.colorScheme}</p>
                      </div>
                    )}
                    {seoResult.thumbnail.tips && (
                      <ul className="space-y-1 mt-2">
                        {seoResult.thumbnail.tips.map((tip, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-pink-500">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* 업로드 전략 */}
              {seoResult.uploadStrategy && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={18} className="text-orange-500" />
                    <h3 className="font-bold text-gray-900">업로드 전략</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-orange-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-orange-600 font-medium mb-1">최적 시간</p>
                      <p className="text-sm font-bold text-gray-900">
                        {(seoResult.uploadStrategy.bestTimes || []).join(', ')}
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-orange-600 font-medium mb-1">최적 요일</p>
                      <p className="text-sm font-bold text-gray-900">
                        {(seoResult.uploadStrategy.bestDays || []).join(', ')}
                      </p>
                    </div>
                  </div>
                  {seoResult.uploadStrategy.frequency && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 font-medium mb-1">추천 빈도</p>
                      <p className="text-sm text-gray-800">{seoResult.uploadStrategy.frequency}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 경쟁 인사이트 */}
              {seoResult.competitorInsight && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={18} className="text-indigo-500" />
                    <h3 className="font-bold text-gray-900">경쟁 분석</h3>
                  </div>
                  <div className="space-y-2">
                    {seoResult.competitorInsight.topStrategy && (
                      <div className="bg-indigo-50 rounded-xl p-3">
                        <p className="text-xs text-indigo-600 font-medium mb-1">상위 영상 전략</p>
                        <p className="text-sm text-gray-800">{seoResult.competitorInsight.topStrategy}</p>
                      </div>
                    )}
                    {seoResult.competitorInsight.gap && (
                      <div className="bg-emerald-50 rounded-xl p-3">
                        <p className="text-xs text-emerald-600 font-medium mb-1">공략 가능한 틈새</p>
                        <p className="text-sm text-gray-800">{seoResult.competitorInsight.gap}</p>
                      </div>
                    )}
                    {seoResult.competitorInsight.differentiation && (
                      <div className="bg-amber-50 rounded-xl p-3">
                        <p className="text-xs text-amber-600 font-medium mb-1">차별화 포인트</p>
                        <p className="text-sm text-gray-800">{seoResult.competitorInsight.differentiation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 프로 팁 */}
              {seoResult.proTips && seoResult.proTips.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
                  <p className="text-xs text-emerald-700 font-bold mb-2">Pro Tips</p>
                  <ul className="space-y-1.5">
                    {seoResult.proTips.map((tip, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <Zap size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 저장된 대본 탭 */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderOpen size={20} className="text-violet-500" />
                <h2 className="font-bold text-gray-900">저장된 대본</h2>
              </div>
              <span className="text-sm text-gray-400">{savedScripts.length}개</span>
            </div>

            {loadingSaved ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto" />
                <p className="text-sm text-gray-400 mt-2">불러오는 중...</p>
              </div>
            ) : savedScripts.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen size={48} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">저장된 대본이 없습니다</p>
                <button
                  onClick={() => setActiveTab('script')}
                  className="mt-3 px-4 py-2 bg-violet-500 text-white rounded-xl text-sm font-medium"
                >
                  대본 만들기
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {savedScripts.map((script) => (
                  <div
                    key={script.id}
                    className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">
                          {script.generated_script?.title || script.brand_name || '제목 없음'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">
                            {script.brand_name}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                            {script.story_concept}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(script.created_at).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleLoadScript(script)}
                          className="p-2 text-violet-500 hover:bg-violet-100 rounded-lg transition-colors"
                          title="불러오기"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteScript(script.id)}
                          disabled={deletingId === script.id}
                          className="p-2 text-red-400 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                          title="삭제"
                        >
                          {deletingId === script.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* 대본 미리보기 */}
                    {script.generated_script?.hook && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">훅</p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {typeof script.generated_script.hook === 'string'
                            ? script.generated_script.hook
                            : script.generated_script.hook?.text || ''}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CreatorAIGuide
