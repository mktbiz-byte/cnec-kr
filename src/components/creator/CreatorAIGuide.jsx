import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  Sparkles, Youtube, FileText, CheckCircle, Copy, Check,
  Loader2, ArrowLeft, Lightbulb, Video, Shield, Star,
  ChevronRight, AlertCircle, RefreshCw, Crown, Wand2,
  Target, TrendingUp, Zap, BookOpen, Film, Mic
} from 'lucide-react'

// MUSE 등급 전용 AI 가이드 플랫폼
const CreatorAIGuide = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [isMuse, setIsMuse] = useState(false)
  const [activeTab, setActiveTab] = useState('guide') // guide, script, verify

  // AI 가이드 관련
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)

  // 아이디어 생성 관련
  const [ideaKeyword, setIdeaKeyword] = useState('')
  const [ideaCategory, setIdeaCategory] = useState('')
  const [generatingIdeas, setGeneratingIdeas] = useState(false)
  const [ideasResult, setIdeasResult] = useState(null)

  // 대본 생성 관련
  const [scriptForm, setScriptForm] = useState({
    brandName: '',
    brandInfo: '',
    storyConcept: '',
    targetAudience: '',
    videoLength: '1-3분',
    additionalNotes: ''
  })
  const [generatingScript, setGeneratingScript] = useState(false)
  const [scriptResult, setScriptResult] = useState(null)

  // 검증 관련
  const [verifying, setVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState(null)

  // 복사 상태
  const [copiedId, setCopiedId] = useState(null)

  // 에러/성공 메시지
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 히스토리
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

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
      // 개발/테스트 목적으로 일시적으로 모든 사용자 허용하려면 아래 주석 해제
      // setIsMuse(true)

      const isMuseGrade = profileData?.cnec_grade_level === 5
      setIsMuse(isMuseGrade)

      if (isMuseGrade) {
        loadHistory()
      }

    } catch (error) {
      console.error('접근 권한 확인 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      // 최근 분석/대본 내역 로드
      const { data: guides } = await supabase
        .from('ai_guides')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      const { data: scripts } = await supabase
        .from('ai_scripts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setHistory([
        ...(guides || []).map(g => ({ ...g, type: 'guide' })),
        ...(scripts || []).map(s => ({ ...s, type: 'script' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))

    } catch (error) {
      console.error('히스토리 로드 오류:', error)
    }
  }

  // 유튜브 분석
  const handleYoutubeAnalysis = async () => {
    if (!youtubeUrl.trim()) {
      setError('유튜브 URL을 입력해주세요.')
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
        guide_type: 'youtube_analysis',
        input_data: { youtubeUrl, videoId: data.videoId },
        result: data.analysis
      })

      setSuccess('유튜브 영상 분석이 완료되었습니다!')
      setTimeout(() => setSuccess(''), 3000)
      loadHistory()

    } catch (error) {
      console.error('유튜브 분석 오류:', error)
      setError(error.message || '분석 중 오류가 발생했습니다.')
    } finally {
      setAnalyzing(false)
    }
  }

  // 아이디어 생성
  const handleIdeaGeneration = async () => {
    if (!ideaKeyword.trim()) {
      setError('키워드를 입력해주세요.')
      return
    }

    try {
      setGeneratingIdeas(true)
      setError('')
      setIdeasResult(null)

      const response = await fetch('/.netlify/functions/ai-idea-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: ideaKeyword,
          category: ideaCategory || '뷰티/라이프스타일'
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || '아이디어 생성에 실패했습니다.')
      }

      setIdeasResult(data.ideas)

      // DB에 저장
      await supabase.from('ai_guides').insert({
        user_id: user.id,
        guide_type: 'idea_generation',
        input_data: { keyword: ideaKeyword, category: ideaCategory },
        result: data.ideas
      })

      setSuccess('콘텐츠 아이디어가 생성되었습니다!')
      setTimeout(() => setSuccess(''), 3000)
      loadHistory()

    } catch (error) {
      console.error('아이디어 생성 오류:', error)
      setError(error.message || '아이디어 생성 중 오류가 발생했습니다.')
    } finally {
      setGeneratingIdeas(false)
    }
  }

  // 대본 생성
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
        body: JSON.stringify(scriptForm)
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

      setSuccess('대본이 생성되었습니다!')
      setTimeout(() => setSuccess(''), 3000)
      loadHistory()

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

    let fullText = `[${scriptResult.title || '대본'}]\n\n`

    if (scriptResult.hook) {
      fullText += `🎬 오프닝 훅:\n${scriptResult.hook}\n\n`
    }

    if (scriptResult.scenes) {
      fullText += `📝 장면별 대본:\n\n`
      scriptResult.scenes.forEach((scene, idx) => {
        fullText += `=== 장면 ${scene.sceneNumber || idx + 1}: ${scene.sceneTitle || ''} ===\n`
        if (scene.duration) fullText += `⏱ 예상 시간: ${scene.duration}\n`
        if (scene.location) fullText += `📍 장소: ${scene.location}\n`
        if (scene.description) fullText += `📋 설명: ${scene.description}\n`
        if (scene.dialogue) fullText += `🎤 대사:\n${scene.dialogue}\n`
        if (scene.cameraNote) fullText += `🎥 카메라: ${scene.cameraNote}\n`
        if (scene.effectNote) fullText += `✨ 효과: ${scene.effectNote}\n`
        fullText += `\n`
      })
    }

    if (scriptResult.callToAction) {
      fullText += `📢 마무리 CTA:\n${scriptResult.callToAction}\n\n`
    }

    if (scriptResult.hashtags) {
      fullText += `#️⃣ 해시태그: ${scriptResult.hashtags.join(' ')}\n`
    }

    await copyToClipboard(fullText, 'full-script')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  // MUSE 등급이 아닌 경우
  if (!isMuse) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-5 pt-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 mb-6"
          >
            <ArrowLeft size={20} />
            <span>뒤로가기</span>
          </button>
        </div>

        <div className="px-5 pb-10">
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 text-white text-center">
            <Crown size={64} className="mx-auto mb-4 opacity-80" />
            <h1 className="text-2xl font-bold mb-2">MUSE 전용 기능</h1>
            <p className="text-white/80 mb-6">
              이 기능은 MUSE 등급 크리에이터만 이용할 수 있습니다.
            </p>
            <div className="bg-white/20 rounded-2xl p-4 text-left text-sm">
              <p className="font-semibold mb-2">🌟 MUSE 등급 혜택</p>
              <ul className="space-y-1 text-white/90">
                <li>• AI 콘텐츠 가이드 무제한 이용</li>
                <li>• 대본 자동 생성 및 검증</li>
                <li>• 전담 매니저 지원</li>
                <li>• 원고비 +30% 프리미엄</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3">MUSE가 되려면?</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              MUSE 등급은 크넥의 최상위 크리에이터 등급입니다.
              종합 점수 95점 이상, 50건 이상의 캠페인 완료 등의
              조건을 충족하면 초대를 받을 수 있습니다.
            </p>
            <button
              onClick={() => navigate('/my/grade')}
              className="mt-4 w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm"
            >
              내 등급 확인하기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-amber-400 to-orange-500 px-5 pt-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-white/80 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Crown size={20} className="text-white" />
            <span className="text-white font-bold">MUSE</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">AI 크리에이터 가이드</h1>
        <p className="text-white/80 text-sm">
          AI가 당신의 콘텐츠 제작을 도와드립니다
        </p>
      </div>

      {/* 알림 메시지 */}
      {(error || success) && (
        <div className={`mx-5 mt-4 p-3 rounded-xl text-sm font-medium ${
          error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {error || success}
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-2xl p-1.5 shadow-sm flex gap-1">
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'guide'
                ? 'bg-amber-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Lightbulb size={18} />
            <span>AI 가이드</span>
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'script'
                ? 'bg-amber-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText size={18} />
            <span>대본 생성</span>
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'verify'
                ? 'bg-amber-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Shield size={18} />
            <span>검증</span>
          </button>
        </div>
      </div>

      {/* AI 가이드 탭 */}
      {activeTab === 'guide' && (
        <div className="px-5 mt-5 space-y-5">
          {/* 유튜브 분석 섹션 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Youtube size={24} className="text-red-500" />
              <h2 className="font-bold text-gray-900">유튜브 영상 분석</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              유튜브 URL을 입력하면 AI가 콘텐츠를 분석하고 인사이트를 제공합니다.
            </p>

            <div className="flex gap-2">
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={handleYoutubeAnalysis}
                disabled={analyzing}
                className="px-5 py-3 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
              >
                {analyzing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    분석중
                  </>
                ) : (
                  '분석'
                )}
              </button>
            </div>

            {/* 분석 결과 */}
            {analysisResult && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">분석 결과</h3>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(analysisResult, null, 2), 'analysis')}
                    className="text-sm text-amber-600 flex items-center gap-1"
                  >
                    {copiedId === 'analysis' ? <Check size={16} /> : <Copy size={16} />}
                    {copiedId === 'analysis' ? '복사됨' : '전체 복사'}
                  </button>
                </div>

                <div className="space-y-4">
                  {analysisResult.estimatedTopic && (
                    <div className="bg-amber-50 rounded-xl p-4">
                      <p className="text-xs text-amber-600 font-medium mb-1">예상 주제</p>
                      <p className="text-sm text-gray-800">{analysisResult.estimatedTopic}</p>
                    </div>
                  )}

                  {analysisResult.successFactors && (
                    <div className="bg-green-50 rounded-xl p-4">
                      <p className="text-xs text-green-600 font-medium mb-2">성공 요인</p>
                      <ul className="space-y-1">
                        {analysisResult.successFactors.map((factor, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <Star size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResult.benchmarkPoints && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-xs text-blue-600 font-medium mb-2">벤치마킹 포인트</p>
                      <ul className="space-y-1">
                        {analysisResult.benchmarkPoints.map((point, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <Target size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResult.improvementIdeas && (
                    <div className="bg-violet-50 rounded-xl p-4">
                      <p className="text-xs text-violet-600 font-medium mb-2">차별화 아이디어</p>
                      <ul className="space-y-1">
                        {analysisResult.improvementIdeas.map((idea, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <Lightbulb size={14} className="text-violet-500 mt-0.5 flex-shrink-0" />
                            {idea}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResult.summary && (
                    <div className="bg-gray-100 rounded-xl p-4">
                      <p className="text-xs text-gray-600 font-medium mb-1">요약</p>
                      <p className="text-sm text-gray-800">{analysisResult.summary}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 아이디어 생성 섹션 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Wand2 size={24} className="text-violet-500" />
              <h2 className="font-bold text-gray-900">콘텐츠 아이디어 추천</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              키워드를 입력하면 AI가 트렌디한 콘텐츠 아이디어를 제안합니다.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                value={ideaKeyword}
                onChange={(e) => setIdeaKeyword(e.target.value)}
                placeholder="예: 겨울 스킨케어, 다이어트 브이로그..."
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <select
                value={ideaCategory}
                onChange={(e) => setIdeaCategory(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">카테고리 선택 (선택사항)</option>
                <option value="뷰티">뷰티</option>
                <option value="라이프스타일">라이프스타일</option>
                <option value="패션">패션</option>
                <option value="먹방/쿡방">먹방/쿡방</option>
                <option value="운동/건강">운동/건강</option>
                <option value="리뷰">리뷰</option>
                <option value="브이로그">브이로그</option>
              </select>
              <button
                onClick={handleIdeaGeneration}
                disabled={generatingIdeas}
                className="w-full py-3 bg-violet-500 text-white rounded-xl font-semibold text-sm hover:bg-violet-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generatingIdeas ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    아이디어 생성중...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    아이디어 생성
                  </>
                )}
              </button>
            </div>

            {/* 아이디어 결과 */}
            {ideasResult && ideasResult.ideas && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">추천 아이디어</h3>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(ideasResult, null, 2), 'ideas')}
                    className="text-sm text-violet-600 flex items-center gap-1"
                  >
                    {copiedId === 'ideas' ? <Check size={16} /> : <Copy size={16} />}
                    {copiedId === 'ideas' ? '복사됨' : '전체 복사'}
                  </button>
                </div>

                <div className="space-y-3">
                  {ideasResult.ideas.map((idea, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 flex-1">{idea.title}</h4>
                        <button
                          onClick={() => copyToClipboard(
                            `${idea.title}\n\n${idea.description}\n\n훅: ${idea.hook}`,
                            `idea-${idx}`
                          )}
                          className="ml-2 p-1.5 text-gray-400 hover:text-violet-500"
                        >
                          {copiedId === `idea-${idx}` ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {idea.format}
                        </span>
                        <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                          바이럴: {idea.viralPotential}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full">
                          {idea.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{idea.description}</p>
                      {idea.hook && (
                        <p className="text-xs text-violet-600 bg-violet-50 p-2 rounded-lg">
                          💡 훅: {idea.hook}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 대본 생성 탭 */}
      {activeTab === 'script' && (
        <div className="px-5 mt-5 space-y-5">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Film size={24} className="text-amber-500" />
              <h2 className="font-bold text-gray-900">AI 대본 생성</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              브랜드 정보와 원하는 스토리를 입력하면 촬영 대본을 자동으로 생성합니다.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">브랜드명 *</label>
                <input
                  type="text"
                  value={scriptForm.brandName}
                  onChange={(e) => setScriptForm({...scriptForm, brandName: e.target.value})}
                  placeholder="예: 설화수, 이니스프리..."
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">브랜드/제품 정보</label>
                <textarea
                  value={scriptForm.brandInfo}
                  onChange={(e) => setScriptForm({...scriptForm, brandInfo: e.target.value})}
                  placeholder="제품 특징, 핵심 메시지, 강조하고 싶은 포인트..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">스토리 컨셉 *</label>
                <select
                  value={scriptForm.storyConcept}
                  onChange={(e) => setScriptForm({...scriptForm, storyConcept: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">스토리 분위기 선택</option>
                  <option value="유머/재미">유머/재미있는</option>
                  <option value="감동/진정성">감동적/진정성 있는</option>
                  <option value="정보전달">정보전달/교육적</option>
                  <option value="일상브이로그">일상 브이로그</option>
                  <option value="언박싱/리뷰">언박싱/리뷰</option>
                  <option value="GRWM">GRWM (Get Ready With Me)</option>
                  <option value="하울">하울/쇼핑</option>
                  <option value="비포애프터">비포&애프터</option>
                  <option value="챌린지">챌린지/참여형</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">타겟 시청자</label>
                <input
                  type="text"
                  value={scriptForm.targetAudience}
                  onChange={(e) => setScriptForm({...scriptForm, targetAudience: e.target.value})}
                  placeholder="예: 20-30대 여성, 피부 고민이 있는 분들..."
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">영상 길이</label>
                <select
                  value={scriptForm.videoLength}
                  onChange={(e) => setScriptForm({...scriptForm, videoLength: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="15-60초">15-60초 (숏폼)</option>
                  <option value="1-3분">1-3분</option>
                  <option value="3-5분">3-5분</option>
                  <option value="5-10분">5-10분</option>
                  <option value="10분 이상">10분 이상</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">추가 요청사항</label>
                <textarea
                  value={scriptForm.additionalNotes}
                  onChange={(e) => setScriptForm({...scriptForm, additionalNotes: e.target.value})}
                  placeholder="특별히 포함하고 싶은 내용, 피해야 할 표현 등..."
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <button
                onClick={handleScriptGeneration}
                disabled={generatingScript}
                className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold text-base hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generatingScript ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    대본 생성중...
                  </>
                ) : (
                  <>
                    <Mic size={20} />
                    대본 생성하기
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 생성된 대본 결과 */}
          {scriptResult && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">
                  📝 {scriptResult.title || '생성된 대본'}
                </h3>
                <button
                  onClick={copyFullScript}
                  className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-sm font-medium flex items-center gap-2"
                >
                  {copiedId === 'full-script' ? <Check size={16} /> : <Copy size={16} />}
                  {copiedId === 'full-script' ? '복사됨!' : '전체 대본 복사'}
                </button>
              </div>

              {scriptResult.totalDuration && (
                <p className="text-sm text-gray-500 mb-4">
                  예상 영상 길이: {scriptResult.totalDuration}
                </p>
              )}

              {/* 오프닝 훅 */}
              {scriptResult.hook && (
                <div className="bg-red-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-red-600 font-bold">🎬 오프닝 훅 (첫 5초)</p>
                    <button
                      onClick={() => copyToClipboard(scriptResult.hook, 'hook')}
                      className="text-red-400 hover:text-red-600"
                    >
                      {copiedId === 'hook' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">{scriptResult.hook}</p>
                </div>
              )}

              {/* 장면별 대본 */}
              {scriptResult.scenes && (
                <div className="space-y-4">
                  {scriptResult.scenes.map((scene, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                        <span className="font-semibold text-gray-900">
                          장면 {scene.sceneNumber || idx + 1}: {scene.sceneTitle}
                        </span>
                        <button
                          onClick={() => copyToClipboard(scene.dialogue || '', `scene-${idx}`)}
                          className="text-gray-400 hover:text-amber-500"
                        >
                          {copiedId === `scene-${idx}` ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                      <div className="p-4 space-y-3">
                        {scene.duration && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>⏱ {scene.duration}</span>
                            {scene.location && <span>📍 {scene.location}</span>}
                          </div>
                        )}

                        {scene.description && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">장면 설명</p>
                            <p className="text-sm text-gray-700">{scene.description}</p>
                          </div>
                        )}

                        {scene.dialogue && (
                          <div className="bg-amber-50 rounded-lg p-3">
                            <p className="text-xs text-amber-600 font-medium mb-1">🎤 대사</p>
                            <p className="text-sm text-gray-800 whitespace-pre-line">{scene.dialogue}</p>
                          </div>
                        )}

                        {(scene.cameraNote || scene.effectNote) && (
                          <div className="flex flex-wrap gap-2">
                            {scene.cameraNote && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                🎥 {scene.cameraNote}
                              </span>
                            )}
                            {scene.effectNote && (
                              <span className="text-xs px-2 py-1 bg-violet-100 text-violet-700 rounded-full">
                                ✨ {scene.effectNote}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA */}
              {scriptResult.callToAction && (
                <div className="bg-green-50 rounded-xl p-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-green-600 font-bold">📢 마무리 CTA</p>
                    <button
                      onClick={() => copyToClipboard(scriptResult.callToAction, 'cta')}
                      className="text-green-400 hover:text-green-600"
                    >
                      {copiedId === 'cta' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-800">{scriptResult.callToAction}</p>
                </div>
              )}

              {/* 해시태그 */}
              {scriptResult.hashtags && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">추천 해시태그</p>
                  <div className="flex flex-wrap gap-2">
                    {scriptResult.hashtags.map((tag, idx) => (
                      <button
                        key={idx}
                        onClick={() => copyToClipboard(tag.startsWith('#') ? tag : `#${tag}`, `tag-${idx}`)}
                        className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-amber-100 hover:text-amber-700"
                      >
                        {tag.startsWith('#') ? tag : `#${tag}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 촬영 팁 */}
              {scriptResult.tips && (
                <div className="mt-4 bg-blue-50 rounded-xl p-4">
                  <p className="text-xs text-blue-600 font-bold mb-2">💡 촬영 팁</p>
                  <ul className="space-y-1">
                    {scriptResult.tips.map((tip, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-blue-500">•</span>
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

      {/* 검증 탭 */}
      {activeTab === 'verify' && (
        <div className="px-5 mt-5 space-y-5">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={24} className="text-emerald-500" />
              <h2 className="font-bold text-gray-900">콘텐츠 사전 검증</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              생성된 대본을 AI가 분석하여 잠재적 리스크와 개선점을 알려드립니다.
            </p>

            {!scriptResult ? (
              <div className="text-center py-8">
                <AlertCircle size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm mb-4">
                  먼저 '대본 생성' 탭에서 대본을 생성해주세요.
                </p>
                <button
                  onClick={() => setActiveTab('script')}
                  className="px-6 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium"
                >
                  대본 생성하러 가기
                </button>
              </div>
            ) : (
              <>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-xs text-gray-500 mb-1">검증할 대본</p>
                  <p className="font-semibold text-gray-900">{scriptResult.title || '생성된 대본'}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {scriptResult.scenes?.length || 0}개 장면
                  </p>
                </div>

                <button
                  onClick={handleScriptVerification}
                  disabled={verifying}
                  className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold text-base hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      검증중...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      대본 검증하기
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {/* 검증 결과 */}
          {verificationResult && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">검증 결과</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  verificationResult.finalVerdict === '승인'
                    ? 'bg-green-100 text-green-700'
                    : verificationResult.finalVerdict === '수정필요'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {verificationResult.finalVerdict || '검토완료'}
                </span>
              </div>

              {/* 전체 점수 */}
              {verificationResult.overallScore && (
                <div className="text-center py-4 mb-4">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500">
                    <span className="text-3xl font-bold text-white">
                      {verificationResult.overallScore}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">종합 점수</p>
                </div>
              )}

              {/* 세부 점수 */}
              {verificationResult.scores && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {Object.entries(verificationResult.scores).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">
                        {key === 'brandAlignment' && '브랜드 정합성'}
                        {key === 'audienceAppeal' && '시청자 매력도'}
                        {key === 'creativity' && '창의성'}
                        {key === 'clarity' && '명확성'}
                        {key === 'engagement' && '참여 유도'}
                      </p>
                      <p className="font-bold text-gray-900">{value}점</p>
                    </div>
                  ))}
                </div>
              )}

              {/* 강점 */}
              {verificationResult.strengths && (
                <div className="bg-green-50 rounded-xl p-4 mb-4">
                  <p className="text-xs text-green-600 font-bold mb-2">✅ 강점</p>
                  <ul className="space-y-1">
                    {verificationResult.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 리스크 */}
              {verificationResult.riskAssessment && verificationResult.riskAssessment.length > 0 && (
                <div className="bg-red-50 rounded-xl p-4 mb-4">
                  <p className="text-xs text-red-600 font-bold mb-2">⚠️ 주의사항</p>
                  <div className="space-y-2">
                    {verificationResult.riskAssessment.map((risk, idx) => (
                      <div key={idx} className="text-sm">
                        <p className="text-gray-800 font-medium">{risk.description}</p>
                        {risk.suggestion && (
                          <p className="text-gray-600 text-xs mt-1">💡 {risk.suggestion}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 개선 제안 */}
              {verificationResult.improvementSuggestions && (
                <div className="bg-blue-50 rounded-xl p-4 mb-4">
                  <p className="text-xs text-blue-600 font-bold mb-2">💡 개선 제안</p>
                  <div className="space-y-3">
                    {verificationResult.improvementSuggestions.map((item, idx) => (
                      <div key={idx} className="text-sm border-b border-blue-100 last:border-0 pb-2 last:pb-0">
                        <p className="text-gray-800 font-medium">{item.area}</p>
                        <p className="text-gray-600 text-xs mt-1">{item.suggested}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 요약 */}
              {verificationResult.summary && (
                <div className="bg-gray-100 rounded-xl p-4">
                  <p className="text-xs text-gray-600 font-medium mb-1">📋 종합 의견</p>
                  <p className="text-sm text-gray-800">{verificationResult.summary}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CreatorAIGuide
