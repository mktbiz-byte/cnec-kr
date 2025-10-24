import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { database, storage } from '../../lib/supabase'
import AdminNavigation from './AdminNavigation'

const CampaignCreationWithTranslator = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  const [campaignForm, setCampaignForm] = useState({
    title: '',
    brand: '',
    description: '',
    requirements: '',
    category: 'youtube',  // youtube, instagram, 4week_challenge
    image_url: '',
    reward_amount: '',
    max_participants: '',
    application_deadline: '',
    start_date: '',
    end_date: '',
    status: 'active',
    target_platforms: {
      instagram: true,
      youtube: false,
      tiktok: false
    },
    // 질문 개별 필드
    question1: '',
    question1_type: 'short',
    question1_options: '',
    question2: '',
    question2_type: 'short',
    question2_options: '',
    question3: '',
    question3_type: 'short',
    question3_options: '',
    question4: '',
    question4_type: 'short',
    question4_options: '',
    // 참가 조건 필드
    age_requirement: '',
    skin_type_requirement: '',
    offline_visit_requirement: ''
  })

  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageFile, setImageFile] = useState(null)



  // 번역 함수
  const translateText = async (text) => {
    if (!text.trim()) return

    setIsTranslating(true)
    setTranslationError('')

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      if (!apiKey) {
        throw new Error('OpenAI API 키가 설정되지 않았습니다.')
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '당신은 한국어를 자연스러운 번역하는 전문 번역가입니다. 마케팅 문구나 캠페인 내용을 번역할 때는 일본 현지 감각에 맞게 자연스럽게 번역해주세요.'
            },
            {
              role: 'user',
              content: `다음 한국어 텍스트를 자연스러운 번역해주세요:\n\n${text}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`번역 API 호출 실패: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      const translatedText = data.choices[0]?.message?.content?.trim()
      
      if (translatedText) {
        setJapaneseText(translatedText)
      } else {
        throw new Error('번역 결과를 받을 수 없습니다')
      }

    } catch (error) {
      console.error('번역 오류:', error)
      setTranslationError(error.message || '번역 중 오류가 발생했습니다.')
    } finally {
      setIsTranslating(false)
    }
  }

  // 이미지 업로드 핸들러
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      setError('イメージファイルのサイズは5MB以下である必要があります。')
      return
    }

    // 파일 형식 체크
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('JPG、PNG、WEBP形式の画像のみ업로드可能です。')
      return
    }

    try {
      setUploadingImage(true)
      setError('')
      setImageFile(file)

      // Supabase Storage에 업로드
      const result = await storage.uploadCampaignImage(file)

      if (result.success) {
        // 업로드 성공 시 URL을 폼에 설정
        setCampaignForm(prev => ({
          ...prev,
          image_url: result.url
        }))
        setSuccess('画像が正常に업로드されました！')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        throw new Error(result.error || '画像の업로드に실패했습니다。')
      }
    } catch (error) {
      console.error('Image upload error:', error)
      setError(error.message || '画像の업로드中に오류가 발생했습니다。')
    } finally {
      setUploadingImage(false)
    }
  }

  // 수정 모드일 때 기존 캠페인 데이터 로드
  useEffect(() => {
    const loadCampaignForEdit = async () => {
      if (editId) {
        try {
          setProcessing(true)
          const campaign = await database.campaigns.getById(editId)
          
          if (campaign) {
            setCampaignForm({
              title: campaign.title || '',
              brand: campaign.brand || '',
              description: campaign.description || '',
              requirements: campaign.requirements || '',
              category: campaign.category || 'beauty',
              image_url: campaign.image_url || '',
              reward_amount: campaign.reward_amount || '',
              max_participants: campaign.max_participants || '',
              application_deadline: campaign.application_deadline || '',
              start_date: campaign.start_date || '',
              end_date: campaign.end_date || '',
              status: campaign.status || 'active',
              target_platforms: campaign.target_platforms || {
                instagram: true,
                youtube: false,
                tiktok: false
              },
              // 개별 질문 필드 매핑
              question1: campaign.question1 || '',
              question1_type: campaign.question1_type || 'short',
              question1_options: campaign.question1_options || '',
              question2: campaign.question2 || '',
              question2_type: campaign.question2_type || 'short',
              question2_options: campaign.question2_options || '',
              question3: campaign.question3 || '',
              question3_type: campaign.question3_type || 'short',
              question3_options: campaign.question3_options || '',
              question4: campaign.question4 || '',
              question4_type: campaign.question4_type || 'short',
              question4_options: campaign.question4_options || '',
              // 참가 조건 필드 매핑
              age_requirement: campaign.age_requirement || '',
              skin_type_requirement: campaign.skin_type_requirement || '',
              offline_visit_requirement: campaign.offline_visit_requirement || ''
            })
          }
        } catch (error) {
          console.error('캠페인 로드 오류:', error)
          setError('캠페인 데이터를 불러오는데 실패했습니다.')
        } finally {
          setProcessing(false)
        }
      }
    }

    loadCampaignForEdit()
  }, [editId])

  // 클립보드에 복사
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('클립보드에 복사되었습니다!')
    } catch (error) {
      console.error('클립보드 복사 실패:', error)
    }
  }

  // 캠페인 저장
  const handleSaveCampaign = async () => {
    setProcessing(true)
    setError('')
    setSuccess('')

    try {
      // 필수 필드 검증
      if (!campaignForm.title || !campaignForm.brand || !campaignForm.requirements) {
        throw new Error('제목, 브랜드, 참가조건은 필수 입력 항목입니다.')
      }

      // 날짜 필드 유효성 검사
      if (!campaignForm.application_deadline || !campaignForm.start_date || !campaignForm.end_date) {
        throw new Error('모집 마감일, 모집 발표일, 촬영 마감일을 모두 입력해주세요.')
      }

      // 날짜 논리 검증
      const applicationDeadline = new Date(campaignForm.application_deadline)
      const startDate = new Date(campaignForm.start_date)
      const endDate = new Date(campaignForm.end_date)

      if (applicationDeadline >= startDate) {
        throw new Error('모집 마감일은 모집 발표일보다 이전이어야 합니다.')
      }

      if (startDate >= endDate) {
        throw new Error('모집 발표일은 촬영 마감일보다 이전이어야 합니다.')
      }

      // SNS 플랫폼 검증
      const hasSelectedPlatform = Object.values(campaignForm.target_platforms).some(Boolean)
      if (!hasSelectedPlatform) {
        throw new Error('최소 하나의 SNS 플랫폼을 선택해주세요.')
      }

      // 캠페인 데이터 준비
      console.log('=== 캠페인 저장 시작 ===');
      console.log('campaignForm.image_url:', campaignForm.image_url);
      
      const campaignData = {
        ...campaignForm,
        image_url: campaignForm.image_url || '',
        reward_amount: parseInt(campaignForm.reward_amount) || 0,
        max_participants: parseInt(campaignForm.max_participants) || 0,
        target_platforms: campaignForm.target_platforms,
        // questions 배열 대신 개별 필드로 저장
        question1: campaignForm.question1 || '',
        question1_type: campaignForm.question1_type || 'short',
        question1_options: campaignForm.question1_options || '',
        question2: campaignForm.question2 || '',
        question2_type: campaignForm.question2_type || 'short',
        question2_options: campaignForm.question2_options || '',
        question3: campaignForm.question3 || '',
        question3_type: campaignForm.question3_type || 'short',
        question3_options: campaignForm.question3_options || '',
        question4: campaignForm.question4 || '',
        question4_type: campaignForm.question4_type || 'short',
        question4_options: campaignForm.question4_options || ''
      }

      console.log('campaignData:', campaignData);
      console.log('campaignData.image_url:', campaignData.image_url);
      
      let result
      if (editId) {
        // 수정 모드
        console.log('캠페인 수정 모드 - ID:', editId);
        result = await database.campaigns.update(editId, campaignData)
        console.log('수정 결과:', result);
      } else {
        // 생성 모드
        result = await database.campaigns.create(campaignData)
      }
      
      if (result.error) {
        throw new Error(result.error.message)
      }

      setSuccess(editId ? '캠페인이 성공적으로 수정되었습니다!' : '캠페인이 성공적으로 생성되었습니다!')
      
      // 생성 모드일 때만 폼 초기화
      if (!editId) {
        setCampaignForm({
        title: '',
        brand: '',
        description: '',
        requirements: '',
        category: 'youtube',  // youtube, instagram, 4week_challenge
        image_url: '',
        reward_amount: '',
        max_participants: '',
        application_deadline: '',
        start_date: '',
        end_date: '',
        status: 'active',
        target_platforms: {
          instagram: true,
          youtube: false,
          tiktok: false
        },
        // 질문 개별 필드
        question1: '',
        question1_type: 'short',
        question1_options: '',
        question2: '',
        question2_type: 'short',
        question2_options: '',
        question3: '',
        question3_type: 'short',
        question3_options: '',
        question4: '',
        question4_type: 'short',
        question4_options: '',
        // 참가 조건 필드
        age_requirement: '',
        skin_type_requirement: '',
        offline_visit_requirement: ''
        })
      }

      // 3초 후 캠페인 관리 페이지로 이동
      setTimeout(() => {
        navigate('/campaigns-manage')
      }, 3000)

    } catch (error) {
      console.error('캠페인 생성 오류:', error)
      setError(error.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">새 캠페인 생성</h1>
          <p className="text-gray-600 mt-2">왼쪽에서 캠페인 정보를 입력하고, 오른쪽 번역기를 활용하세요.</p>
        </div>

        {/* 알림 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* 좌우 분할 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 왼쪽: 캠페인 생성 폼 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">📝 캠페인 정보</h2>
            
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  캠페인 제목 *
                </label>
                <input
                  type="text"
                  value={campaignForm.title}
                  onChange={(e) => setCampaignForm({...campaignForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="캠페인 제목을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  브랜드 *
                </label>
                <input
                  type="text"
                  value={campaignForm.brand}
                  onChange={(e) => setCampaignForm({...campaignForm, brand: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="브랜드명을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  キャンペーン画像
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {uploadingImage && (
                    <p className="text-sm text-blue-600">画像を업로드中...</p>
                  )}
                  {campaignForm.image_url && (
                    <div className="mt-2">
                      <img 
                        src={campaignForm.image_url} 
                        alt="Campaign preview" 
                        className="h-32 w-auto object-cover rounded border"
                      />
                      <p className="text-xs text-gray-500 mt-1">画像が正常に업로드されました</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">最大ファイルサイズ: 5MB. 形式: JPG, PNG, WEBP</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({...campaignForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="캠페인 설명을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  참가조건 *
                </label>
                <textarea
                  value={campaignForm.requirements}
                  onChange={(e) => setCampaignForm({...campaignForm, requirements: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="참가 조건을 입력하세요"
                />
              </div>

              {/* 보상 및 참가자 수 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    보상금액
                  </label>
                  <input
                    type="number"
                    value={campaignForm.reward_amount}
                    onChange={(e) => setCampaignForm({...campaignForm, reward_amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    최대 참가자수
                  </label>
                  <input
                    type="number"
                    value={campaignForm.max_participants}
                    onChange={(e) => setCampaignForm({...campaignForm, max_participants: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* 날짜 설정 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">📅 일정 설정</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      모집 마감일 *
                    </label>
                    <input
                      type="date"
                      value={campaignForm.application_deadline}
                      onChange={(e) => setCampaignForm({...campaignForm, application_deadline: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      모집 발표일 *
                    </label>
                    <input
                      type="date"
                      value={campaignForm.start_date}
                      onChange={(e) => setCampaignForm({...campaignForm, start_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      촬영 마감일 *
                    </label>
                    <input
                      type="date"
                      value={campaignForm.end_date}
                      onChange={(e) => setCampaignForm({...campaignForm, end_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    💡 <strong>일정 가이드:</strong> 모집 마감일 → 모집 발표일 → 촬영 마감일 순서로 설정해주세요.
                  </p>
                </div>
              </div>

              {/* SNS 플랫폼 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  대상 SNS 플랫폼 *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={campaignForm.target_platforms.instagram}
                      onChange={(e) => setCampaignForm({
                        ...campaignForm,
                        target_platforms: {
                          ...campaignForm.target_platforms,
                          instagram: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    📷 Instagram
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={campaignForm.target_platforms.youtube}
                      onChange={(e) => setCampaignForm({
                        ...campaignForm,
                        target_platforms: {
                          ...campaignForm.target_platforms,
                          youtube: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    🎥 YouTube
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={campaignForm.target_platforms.tiktok}
                      onChange={(e) => setCampaignForm({
                        ...campaignForm,
                        target_platforms: {
                          ...campaignForm.target_platforms,
                          tiktok: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    🎵 TikTok
                  </label>
                </div>
              </div>

              {/* 나이 및 피부타입 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    나이 조건
                  </label>
                  <input
                    type="text"
                    value={campaignForm.age_requirement || ''}
                    onChange={(e) => setCampaignForm({...campaignForm, age_requirement: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 20-30세"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    피부타입
                  </label>
                  <select
                    value={campaignForm.skin_type_requirement || ''}
                    onChange={(e) => setCampaignForm({...campaignForm, skin_type_requirement: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="건성">건성</option>
                    <option value="지성">지성</option>
                    <option value="복합성">복합성</option>
                    <option value="민감성">민감성</option>
                    <option value="모든타입">모든타입</option>
                  </select>
                </div>
              </div>

              {/* 오프라인 방문 조건 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  오프라인 방문 조건
                  <button
                    type="button"
                    onClick={() => setCampaignForm({...campaignForm, offline_visit_requirement: ''})}
                    className="ml-2 text-xs text-red-600 hover:text-red-800"
                  >
                    [조건 없애기]
                  </button>
                </label>
                <textarea
                  value={campaignForm.offline_visit_requirement || ''}
                  onChange={(e) => setCampaignForm({...campaignForm, offline_visit_requirement: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 서울 강남구 오프라인 매장 방문 필수, 체험 후기 작성 등 (선택사항)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  오프라인 방문이 필요한 경우에만 작성하세요. 비워두면 온라인 전용 캠페인이 됩니다.
                </p>
              </div>

              {/* 질문 4가지 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">질문</h3>
                
                <div className="space-y-6">
                  {/* 질문 1 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          질문 1
                        </label>
                        <input
                          type="text"
                          value={campaignForm.question1 || ''}
                          onChange={(e) => setCampaignForm({...campaignForm, question1: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="질문 1을 입력하세요"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          답변 형태
                        </label>
                        <select
                          value={campaignForm.question1_type || 'short'}
                          onChange={(e) => setCampaignForm({...campaignForm, question1_type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="short">짧은답변</option>
                          <option value="long">긴답변</option>
                          <option value="checkbox">체크박스</option>
                        </select>
                      </div>
                    </div>

                    {campaignForm.question1_type === 'checkbox' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          선택 옵션 (쉼표로 구분)
                        </label>
                        <input
                          type="text"
                          value={campaignForm.question1_options || ''}
                          onChange={(e) => setCampaignForm({...campaignForm, question1_options: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="옵션1, 옵션2, 옵션3"
                        />
                      </div>
                    )}
                  </div>

                  {/* 질문 2 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          질문 2
                        </label>
                        <input
                          type="text"
                          value={campaignForm.question2 || ''}
                          onChange={(e) => setCampaignForm({...campaignForm, question2: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="질문 2를 입력하세요"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          답변 형태
                        </label>
                        <select
                          value={campaignForm.question2_type || 'short'}
                          onChange={(e) => setCampaignForm({...campaignForm, question2_type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="short">짧은답변</option>
                          <option value="long">긴답변</option>
                          <option value="checkbox">체크박스</option>
                        </select>
                      </div>
                    </div>

                    {campaignForm.question2_type === 'checkbox' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          선택 옵션 (쉼표로 구분)
                        </label>
                        <input
                          type="text"
                          value={campaignForm.question2_options || ''}
                          onChange={(e) => setCampaignForm({...campaignForm, question2_options: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="옵션1, 옵션2, 옵션3"
                        />
                      </div>
                    )}
                  </div>

                  {/* 질문 3 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          질문 3
                        </label>
                        <input
                          type="text"
                          value={campaignForm.question3 || ''}
                          onChange={(e) => setCampaignForm({...campaignForm, question3: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="질문 3을 입력하세요"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          답변 형태
                        </label>
                        <select
                          value={campaignForm.question3_type || 'short'}
                          onChange={(e) => setCampaignForm({...campaignForm, question3_type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="short">짧은답변</option>
                          <option value="long">긴답변</option>
                          <option value="checkbox">체크박스</option>
                        </select>
                      </div>
                    </div>

                    {campaignForm.question3_type === 'checkbox' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          선택 옵션 (쉼표로 구분)
                        </label>
                        <input
                          type="text"
                          value={campaignForm.question3_options || ''}
                          onChange={(e) => setCampaignForm({...campaignForm, question3_options: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="옵션1, 옵션2, 옵션3"
                        />
                      </div>
                    )}
                  </div>

                  {/* 질문 4 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          질문 4
                        </label>
                        <input
                          type="text"
                          value={campaignForm.question4 || ''}
                          onChange={(e) => setCampaignForm({...campaignForm, question4: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="질문 4를 입력하세요"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          답변 형태
                        </label>
                        <select
                          value={campaignForm.question4_type || 'short'}
                          onChange={(e) => setCampaignForm({...campaignForm, question4_type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="short">짧은답변</option>
                          <option value="long">긴답변</option>
                          <option value="checkbox">체크박스</option>
                        </select>
                      </div>
                    </div>

                    {campaignForm.question4_type === 'checkbox' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          선택 옵션 (쉼표로 구분)
                        </label>
                        <input
                          type="text"
                          value={campaignForm.question4_options || ''}
                          onChange={(e) => setCampaignForm({...campaignForm, question4_options: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="옵션1, 옵션2, 옵션3"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 저장 버튼 */}
              <div className="pt-4">
                <button
                  onClick={handleSaveCampaign}
                  disabled={processing}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {processing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      저장 중...
                    </>
                  ) : (
                    '💾 캠페인 저장'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 오른쪽: 번역기 (스크롤 따라다님) */}
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4 h-fit">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">🌐 캠페인 정보</h2>
            
            <div className="space-y-6">
              {/* 한국어 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 한국어 입력
                </label>
                <textarea
                  value={koreanText}
                  onChange={(e) => setKoreanText(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="번역할 한국어 텍스트를 입력하세요..."
                />
                <div className="text-sm text-gray-500 mt-1">
                  {koreanText.length} / 500자
                </div>
              </div>

              {/* 번역 버튼 */}
              <button
                onClick={() => translateText(koreanText)}
                disabled={isTranslating || !koreanText.trim()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isTranslating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    번역 중...
                  </>
                ) : (
                  '🔄 번역하기'
                )}
              </button>

              {/* 번역 오류 */}
              {translationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{translationError}</p>
                </div>
              )}

              {/* 일본어 결과 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🇯🇵 번역 결과
                </label>
                <div className="relative">
                  <textarea
                    value={japaneseText}
                    onChange={(e) => setJapaneseText(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50"
                    placeholder="번역 결과가 여기에 표시됩니다..."
                  />
                  {japaneseText && (
                    <button
                      onClick={() => copyToClipboard(japaneseText)}
                      className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      📋 복사
                    </button>
                  )}
                </div>
                {japaneseText && (
                  <div className="text-sm text-gray-500 mt-1">
                    {japaneseText.length}자
                  </div>
                )}
              </div>

              {/* 사용 팁 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h4 className="font-medium text-yellow-800 mb-2">💡 사용 팁</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 번역 결과는 수정 가능합니다</li>
                  <li>• 복사 버튼으로 쉽게 캠페인 폼에 붙여넣기 할 수 있습니다</li>
                  <li>• 마케팅 문구는 현지 감각에 맞게 자연스럽게 번역됩니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CampaignCreationWithTranslator
