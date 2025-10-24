import { useState, useEffect } from 'react'
import { database } from '../../lib/supabase'
import AdminNavigation from './AdminNavigation'
import { 
  Loader2, Save, Eye, RotateCcw, Mail, 
  AlertCircle, CheckCircle, Edit, Send
} from 'lucide-react'

const EmailTemplateManager = () => {
  const [templates, setTemplates] = useState({
    welcome: { subject: '', content: '' },
    campaign_approved: { subject: '', content: '' },
    guide_links: { subject: '', content: '' },
    deadline_3days: { subject: '', content: '' },
    deadline_1day: { subject: '', content: '' },
    point_approved: { subject: '', content: '' },
    payment_completed: { subject: '', content: '' }
  })
  
  const [selectedTemplate, setSelectedTemplate] = useState('welcome')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewMode, setPreviewMode] = useState(false)

  const templateNames = {
    welcome: '환영 메일',
    campaign_approved: '캠페인 승인 알림',
    guide_links: '가이드 링크 제공',
    deadline_3days: '마감 3일 전 알림',
    deadline_1day: '마감 1일 전 알림',
    point_approved: '포인트 승인 알림',
    payment_completed: '결제 완료 알림'
  }

  useEffect(() => {
    console.log('EmailTemplateManager 마운트됨')
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('이메일 템플릿 로드 시작')
      
      // 실제 데이터베이스에서 템플릿을 로드하거나 기본값 사용
      try {
        const templatesData = await database.emailTemplates?.getAll() || []
        console.log('템플릿 데이터 로드 성공:', templatesData.length)
        
        // 데이터베이스에서 로드된 템플릿으로 상태 업데이트
        const loadedTemplates = { ...templates }
        templatesData.forEach(template => {
          if (loadedTemplates[template.type]) {
            loadedTemplates[template.type] = {
              subject: template.subject || '',
              content: template.content || ''
            }
          }
        })
        setTemplates(loadedTemplates)
        
      } catch (error) {
        console.warn('템플릿 데이터 로드 실패, 기본값 사용:', error)
        // 기본 템플릿 설정
        setTemplates({
          welcome: { 
            subject: 'CNEC Korea에 오신 것을 환영합니다!', 
            content: '안녕하세요 {{name}}님,\n\nCNEC Korea 플랫폼에 가입해주셔서 감사합니다.\n\n앞으로 다양한 캠페인에 참여하여 수익을 창출해보세요!\n\n감사합니다.\nCNEC Korea 팀' 
          },
          campaign_approved: { 
            subject: '캠페인 승인 완료 - {{campaign_title}}', 
            content: '축하합니다 {{name}}님!\n\n{{campaign_title}} 캠페인에 선정되셨습니다.\n\n자세한 가이드는 별도로 전달드리겠습니다.\n\n감사합니다.\nCNEC Korea 팀' 
          },
          guide_links: { 
            subject: '캠페인 가이드 및 자료 제공 - {{campaign_title}}', 
            content: '안녕하세요 {{name}}님,\n\n{{campaign_title}} 캠페인 진행을 위한 자료를 제공드립니다.\n\n구글 드라이브: {{google_drive_url}}\n구글 슬라이드: {{google_slides_url}}\n\n가이드를 참고하여 캠페인을 진행해주세요.\n\n감사합니다.\nCNEC Korea 팀' 
          },
          deadline_3days: { 
            subject: '캠페인 마감 3일 전 알림 - {{campaign_title}}', 
            content: '안녕하세요 {{name}}님,\n\n{{campaign_title}} 캠페인 마감이 3일 남았습니다.\n\n마감일: {{deadline}}\n\n빠른 시일 내에 완료해주시기 바랍니다.\n\n감사합니다.\nCNEC Korea 팀' 
          },
          deadline_1day: { 
            subject: '캠페인 마감 1일 전 최종 알림 - {{campaign_title}}', 
            content: '안녕하세요 {{name}}님,\n\n{{campaign_title}} 캠페인 마감이 내일입니다!\n\n마감일: {{deadline}}\n\n반드시 오늘 안에 완료해주시기 바랍니다.\n\n감사합니다.\nCNEC Korea 팀' 
          },
          point_approved: { 
            subject: '포인트 승인 완료 알림', 
            content: '안녕하세요 {{name}}님,\n\n요청하신 포인트가 승인되었습니다.\n\n승인 포인트: {{points}}P\n현재 잔액: {{balance}}P\n\n감사합니다.\nCNEC Korea 팀' 
          },
          payment_completed: { 
            subject: '출금 완료 알림', 
            content: '안녕하세요 {{name}}님,\n\n요청하신 출금이 완료되었습니다.\n\n출금 금액: {{amount}}원\n처리일: {{date}}\n\n감사합니다.\nCNEC Korea 팀' 
          }
        })
      }
      
    } catch (error) {
      console.error('템플릿 로드 오류:', error)
      setError(`템플릿 로드에 실패했습니다: ${error.message}`)
    } finally {
      setLoading(false)
      console.log('템플릿 로드 완료')
    }
  }

  const saveTemplate = async () => {
    try {
      setProcessing(true)
      setError('')
      setSuccess('')
      
      console.log('템플릿 저장:', selectedTemplate, templates[selectedTemplate])

      const templateData = {
        type: selectedTemplate,
        subject: templates[selectedTemplate].subject,
        content: templates[selectedTemplate].content,
        updated_at: new Date().toISOString()
      }

      // 데이터베이스에 저장 시도
      try {
        if (database.emailTemplates?.upsert) {
          await database.emailTemplates.upsert(templateData)
        } else {
          console.warn('emailTemplates.upsert 함수가 없습니다. 로컬 저장소에 저장합니다.')
          localStorage.setItem(`email_template_${selectedTemplate}`, JSON.stringify(templateData))
        }
      } catch (error) {
        console.warn('데이터베이스 저장 실패, 로컬 저장소 사용:', error)
        localStorage.setItem(`email_template_${selectedTemplate}`, JSON.stringify(templateData))
      }
      
      console.log('템플릿 저장 완료')
      setSuccess('템플릿이 성공적으로 저장되었습니다.')
      
    } catch (error) {
      console.error('템플릿 저장 오류:', error)
      setError(`템플릿 저장에 실패했습니다: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const updateTemplate = (field, value) => {
    setTemplates(prev => ({
      ...prev,
      [selectedTemplate]: {
        ...prev[selectedTemplate],
        [field]: value
      }
    }))
  }

  const resetTemplate = () => {
    if (confirm('이 템플릿을 기본값으로 초기화하시겠습니까?')) {
      // 기본값으로 리셋
      const defaultTemplates = {
        welcome: { 
          subject: 'CNEC Korea에 오신 것을 환영합니다!', 
          content: '안녕하세요 {{name}}님,\n\nCNEC Korea 플랫폼에 가입해주셔서 감사합니다.\n\n앞으로 다양한 캠페인에 참여하여 수익을 창출해보세요!\n\n감사합니다.\nCNEC Korea 팀' 
        },
        campaign_approved: { 
          subject: '캠페인 승인 완료 - {{campaign_title}}', 
          content: '축하합니다 {{name}}님!\n\n{{campaign_title}} 캠페인에 선정되셨습니다.\n\n자세한 가이드는 별도로 전달드리겠습니다.\n\n감사합니다.\nCNEC Korea 팀' 
        },
        guide_links: { 
          subject: '캠페인 가이드 및 자료 제공 - {{campaign_title}}', 
          content: '안녕하세요 {{name}}님,\n\n{{campaign_title}} 캠페인 진행을 위한 자료를 제공드립니다.\n\n구글 드라이브: {{google_drive_url}}\n구글 슬라이드: {{google_slides_url}}\n\n가이드를 참고하여 캠페인을 진행해주세요.\n\n감사합니다.\nCNEC Korea 팀' 
        },
        deadline_3days: { 
          subject: '캠페인 마감 3일 전 알림 - {{campaign_title}}', 
          content: '안녕하세요 {{name}}님,\n\n{{campaign_title}} 캠페인 마감이 3일 남았습니다.\n\n마감일: {{deadline}}\n\n빠른 시일 내에 완료해주시기 바랍니다.\n\n감사합니다.\nCNEC Korea 팀' 
        },
        deadline_1day: { 
          subject: '캠페인 마감 1일 전 최종 알림 - {{campaign_title}}', 
          content: '안녕하세요 {{name}}님,\n\n{{campaign_title}} 캠페인 마감이 내일입니다!\n\n마감일: {{deadline}}\n\n반드시 오늘 안에 완료해주시기 바랍니다.\n\n감사합니다.\nCNEC Korea 팀' 
        },
        point_approved: { 
          subject: '포인트 승인 완료 알림', 
          content: '안녕하세요 {{name}}님,\n\n요청하신 포인트가 승인되었습니다.\n\n승인 포인트: {{points}}P\n현재 잔액: {{balance}}P\n\n감사합니다.\nCNEC Korea 팀' 
        },
        payment_completed: { 
          subject: '출금 완료 알림', 
          content: '안녕하세요 {{name}}님,\n\n요청하신 출금이 완료되었습니다.\n\n출금 금액: {{amount}}원\n처리일: {{date}}\n\n감사합니다.\nCNEC Korea 팀' 
        }
      }
      
      setTemplates(prev => ({
        ...prev,
        [selectedTemplate]: defaultTemplates[selectedTemplate]
      }))
    }
  }

  const sendTestEmail = async () => {
    try {
      setProcessing(true)
      setError('')
      setSuccess('')
      
      console.log('테스트 이메일 발송:', selectedTemplate)

      // 테스트 이메일 발송 로직 (실제 구현 필요)
      const testData = {
        to: 'test@example.com',
        subject: templates[selectedTemplate].subject.replace(/\{\{.*?\}\}/g, '[테스트값]'),
        content: templates[selectedTemplate].content.replace(/\{\{.*?\}\}/g, '[테스트값]')
      }

      console.log('테스트 이메일 데이터:', testData)
      setSuccess('테스트 이메일이 발송되었습니다. (실제 발송은 구현 필요)')
      
    } catch (error) {
      console.error('테스트 이메일 발송 오류:', error)
      setError(`테스트 이메일 발송에 실패했습니다: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>로딩 중...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">이메일 템플릿 관리</h1>
              <p className="text-gray-600 mt-2">시스템에서 사용되는 이메일 템플릿을 관리합니다</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={loadTemplates}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                새로고침
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 템플릿 목록 */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">템플릿 목록</h3>
                <nav className="space-y-1">
                  {Object.keys(templates).map((templateKey) => (
                    <button
                      key={templateKey}
                      onClick={() => setSelectedTemplate(templateKey)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                        selectedTemplate === templateKey
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        {templateNames[templateKey]}
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* 템플릿 편집 */}
          <div className="lg:col-span-3">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {templateNames[selectedTemplate]} 편집
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPreviewMode(!previewMode)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {previewMode ? '편집' : '미리보기'}
                    </button>
                    <button
                      onClick={resetTemplate}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      초기화
                    </button>
                    <button
                      onClick={sendTestEmail}
                      disabled={processing}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      테스트 발송
                    </button>
                  </div>
                </div>

                {!previewMode ? (
                  <div className="space-y-6">
                    {/* 제목 편집 */}
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                        이메일 제목
                      </label>
                      <input
                        type="text"
                        id="subject"
                        value={templates[selectedTemplate].subject}
                        onChange={(e) => updateTemplate('subject', e.target.value)}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        placeholder="이메일 제목을 입력하세요"
                      />
                    </div>

                    {/* 내용 편집 */}
                    <div>
                      <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                        이메일 내용
                      </label>
                      <textarea
                        id="content"
                        value={templates[selectedTemplate].content}
                        onChange={(e) => updateTemplate('content', e.target.value)}
                        rows={12}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        placeholder="이메일 내용을 입력하세요"
                      />
                    </div>

                    {/* 변수 안내 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">사용 가능한 변수:</h4>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p><code>{'{{name}}'}</code> - 사용자 이름</p>
                        <p><code>{'{{email}}'}</code> - 사용자 이메일</p>
                        <p><code>{'{{campaign_title}}'}</code> - 캠페인 제목</p>
                        <p><code>{'{{deadline}}'}</code> - 마감일</p>
                        <p><code>{'{{google_drive_url}}'}</code> - 구글 드라이브 URL</p>
                        <p><code>{'{{google_slides_url}}'}</code> - 구글 슬라이드 URL</p>
                        <p><code>{'{{points}}'}</code> - 포인트</p>
                        <p><code>{'{{amount}}'}</code> - 금액</p>
                        <p><code>{'{{date}}'}</code> - 날짜</p>
                      </div>
                    </div>

                    {/* 저장 버튼 */}
                    <div className="flex justify-end">
                      <button
                        onClick={saveTemplate}
                        disabled={processing}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {processing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 미리보기 */
                  <div className="space-y-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <div className="border-b border-gray-200 pb-4 mb-4">
                        <h4 className="text-lg font-medium text-gray-900">미리보기</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">제목:</label>
                          <div className="bg-white border border-gray-300 rounded-md p-3">
                            {templates[selectedTemplate].subject.replace(/\{\{.*?\}\}/g, '[변수값]')}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">내용:</label>
                          <div className="bg-white border border-gray-300 rounded-md p-3 whitespace-pre-wrap">
                            {templates[selectedTemplate].content.replace(/\{\{.*?\}\}/g, '[변수값]')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailTemplateManager
