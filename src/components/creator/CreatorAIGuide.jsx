import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  Sparkles, Youtube, FileText, CheckCircle, Copy, Check,
  Loader2, ArrowLeft, Video, Crown, Play,
  ChevronRight, AlertCircle, Zap, Clock, Film
} from 'lucide-react'

// MUSE 등급 전용 AI 숏폼 가이드 플랫폼
const CreatorAIGuide = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [isMuse, setIsMuse] = useState(false)
  const [activeTab, setActiveTab] = useState('analyze') // analyze, script

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

    } catch (error) {
      console.error('접근 권한 확인 오류:', error)
    } finally {
      setLoading(false)
    }
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
      fullText += `🎬 훅 (첫 3초):\n${scriptResult.hook}\n\n`
    }

    if (scriptResult.scenes) {
      fullText += `📝 장면별 대본:\n\n`
      scriptResult.scenes.forEach((scene, idx) => {
        fullText += `--- ${scene.sceneTitle || `장면 ${idx + 1}`} (${scene.duration || ''}) ---\n`
        if (scene.dialogue) fullText += `🎤 ${scene.dialogue}\n`
        if (scene.action) fullText += `📍 ${scene.action}\n`
        fullText += `\n`
      })
    }

    if (scriptResult.callToAction) {
      fullText += `📢 CTA:\n${scriptResult.callToAction}\n\n`
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
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setActiveTab('analyze')}
          className={`p-4 rounded-2xl text-left transition-all ${
            activeTab === 'analyze'
              ? 'bg-red-500 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-100 shadow-sm'
          }`}
        >
          <Youtube size={24} className={activeTab === 'analyze' ? 'text-white' : 'text-red-500'} />
          <p className="font-bold mt-2">숏폼 분석</p>
          <p className={`text-xs mt-0.5 ${activeTab === 'analyze' ? 'text-white/70' : 'text-gray-400'}`}>
            Shorts URL 입력
          </p>
        </button>

        <button
          onClick={() => setActiveTab('script')}
          className={`p-4 rounded-2xl text-left transition-all ${
            activeTab === 'script'
              ? 'bg-amber-500 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-100 shadow-sm'
          }`}
        >
          <FileText size={24} className={activeTab === 'script' ? 'text-white' : 'text-amber-500'} />
          <p className="font-bold mt-2">대본 생성</p>
          <p className={`text-xs mt-0.5 ${activeTab === 'script' ? 'text-white/70' : 'text-gray-400'}`}>
            15~60초 숏폼
          </p>
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
                      onClick={() => copyToClipboard(scriptResult.hook, 'hook')}
                      className="text-red-400 hover:text-red-600"
                    >
                      {copiedId === 'hook' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">{scriptResult.hook}</p>
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
                      {scene.action && (
                        <p className="text-xs text-gray-500 mt-1">📍 {scene.action}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* CTA */}
              {scriptResult.callToAction && (
                <div className="bg-green-50 rounded-xl p-3 mb-3">
                  <p className="text-xs text-green-600 font-bold mb-1">📢 CTA</p>
                  <p className="text-sm text-gray-800">{scriptResult.callToAction}</p>
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
                <h3 className="font-bold text-gray-900">검증 결과</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  verificationResult.finalVerdict === '승인'
                    ? 'bg-green-100 text-green-700'
                    : verificationResult.finalVerdict === '수정필요'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {verificationResult.finalVerdict || '검토완료'}
                </span>
              </div>

              {verificationResult.overallScore && (
                <div className="text-center py-3 mb-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500">
                    <span className="text-xl font-bold text-white">
                      {verificationResult.overallScore}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">종합 점수</p>
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
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-blue-600 font-bold mb-1">💡 개선 제안</p>
                  <ul className="space-y-0.5">
                    {verificationResult.improvementSuggestions.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {item.suggested || item}</li>
                    ))}
                  </ul>
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
