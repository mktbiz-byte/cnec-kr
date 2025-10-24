import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { database } from '../../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Loader2, Plus, Edit, Save, X, ExternalLink, 
  AlertCircle, CheckCircle, Link as LinkIcon, 
  FileText, Folder, Users
} from 'lucide-react'

const CreatorMaterialsManager = ({ campaignId, applications }) => {
  const { language } = useLanguage()
  
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [selectedCreator, setSelectedCreator] = useState(null)
  const [materialModal, setMaterialModal] = useState(false)
  
  const [materialForm, setMaterialForm] = useState({
    google_drive_url: '',
    google_slides_url: '',
    additional_notes: ''
  })

  // 승인된 크리에이터만 필터링
  const approvedCreators = applications.filter(app => app.status === 'approved')

  useEffect(() => {
    if (campaignId) {
      loadMaterials()
    }
  }, [campaignId])

  const loadMaterials = async () => {
    try {
      setLoading(true)
      setError('')
      
      const { data, error } = await database.supabase
        .from('creator_materials')
        .select('*')
        .eq('campaign_id', campaignId)
      
      if (error) throw error
      setMaterials(data || [])
      
    } catch (error) {
      console.error('Load materials error:', error)
      setError(language === 'ko' 
        ? '자료를 불러올 수 없습니다.'
        : '資料を読み込めません。'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMaterials = async () => {
    try {
      setProcessing(true)
      setError('')
      
      if (!selectedCreator) return
      
      const materialData = {
        campaign_id: campaignId,
        creator_id: selectedCreator.user_id,
        application_id: selectedCreator.id,
        google_drive_url: materialForm.google_drive_url,
        google_slides_url: materialForm.google_slides_url,
        additional_notes: materialForm.additional_notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // 기존 자료가 있는지 확인
      const existingMaterial = materials.find(m => m.creator_id === selectedCreator.user_id)
      
      if (existingMaterial) {
        // 업데이트
        const { error } = await database.supabase
          .from('creator_materials')
          .update({
            google_drive_url: materialForm.google_drive_url,
            google_slides_url: materialForm.google_slides_url,
            additional_notes: materialForm.additional_notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMaterial.id)
        
        if (error) throw error
      } else {
        // 새로 생성
        const { error } = await database.supabase
          .from('creator_materials')
          .insert([materialData])
        
        if (error) throw error
      }
      
      setSuccess(language === 'ko' 
        ? '크리에이터 자료가 저장되었습니다.'
        : '크리에이터資料が저장されました。'
      )
      
      await loadMaterials()
      setMaterialModal(false)
      resetForm()
      
    } catch (error) {
      console.error('Save materials error:', error)
      setError(language === 'ko' 
        ? '자료 저장 중 오류가 발생했습니다.'
        : '資料저장中に오류가 발생했습니다。'
      )
    } finally {
      setProcessing(false)
    }
  }

  const openMaterialModal = (creator) => {
    setSelectedCreator(creator)
    
    // 기존 자료가 있으면 폼에 로드
    const existingMaterial = materials.find(m => m.creator_id === creator.user_id)
    if (existingMaterial) {
      setMaterialForm({
        google_drive_url: existingMaterial.google_drive_url || '',
        google_slides_url: existingMaterial.google_slides_url || '',
        additional_notes: existingMaterial.additional_notes || ''
      })
    } else {
      resetForm()
    }
    
    setMaterialModal(true)
  }

  const resetForm = () => {
    setMaterialForm({
      google_drive_url: '',
      google_slides_url: '',
      additional_notes: ''
    })
    setSelectedCreator(null)
  }

  const getCreatorMaterial = (creatorId) => {
    return materials.find(m => m.creator_id === creatorId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {language === 'ko' ? '크리에이터 자료 관리' : '크리에이터資料管理'}
          </h3>
          <p className="text-sm text-gray-600">
            {language === 'ko' 
              ? '승인된 크리에이터에게 개별 Google Drive/Slides 링크를 제공하세요.'
              : '승인された크리에이터に個別のGoogle Drive/Slidesリンクを提供してください。'
            }
          </p>
        </div>
        <Badge variant="outline">
          {language === 'ko' ? `승인된 크리에이터: ${approvedCreators.length}명` : `승인됨: ${approvedCreators.length}명`}
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {approvedCreators.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">
                {language === 'ko' 
                  ? '승인된 크리에이터가 없습니다.'
                  : '승인された크리에이터がいません。'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          approvedCreators.map((creator) => {
            const material = getCreatorMaterial(creator.user_id)
            const hasMaterials = material && (material.google_drive_url || material.google_slides_url)
            
            return (
              <Card key={creator.id} className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{creator.name}</CardTitle>
                      <CardDescription>{creator.email}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasMaterials ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {language === 'ko' ? '자료 제공됨' : '資料提供済み'}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {language === 'ko' ? '자료 미제공' : '資料未提供'}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        onClick={() => openMaterialModal(creator)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {language === 'ko' ? '자료 관리' : '資料管理'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {hasMaterials && (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {material.google_drive_url && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Folder className="h-4 w-4 text-blue-600" />
                          <span>Google Drive:</span>
                          <a 
                            href={material.google_drive_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center"
                          >
                            {language === 'ko' ? '링크 열기' : 'リンクを開く'}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </div>
                      )}
                      {material.google_slides_url && (
                        <div className="flex items-center space-x-2 text-sm">
                          <FileText className="h-4 w-4 text-orange-600" />
                          <span>Google Slides:</span>
                          <a 
                            href={material.google_slides_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center"
                          >
                            {language === 'ko' ? '링크 열기' : 'リンクを開く'}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </div>
                      )}
                      {material.additional_notes && (
                        <div className="text-sm text-gray-600 mt-2">
                          <strong>{language === 'ko' ? '추가 메모:' : '추가メモ:'}</strong> {material.additional_notes}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* 자료 관리 모달 */}
      <Dialog open={materialModal} onOpenChange={setMaterialModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {language === 'ko' ? '크리에이터 자료 관리' : '크리에이터資料管理'}
            </DialogTitle>
            <DialogDescription>
              {selectedCreator && (
                <>
                  {language === 'ko' 
                    ? `${selectedCreator.name}님에게 제공할 자료 링크를 설정하세요.`
                    : `${selectedCreator.name}さんに提供する資料リンクを설정してください。`
                  }
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {language === 'ko' 
                  ? '각 크리에이터마다 고유한 Google Drive 폴더와 Slides 가이드를 제공하세요. 캠페인별, 크리에이터별로 모두 다른 자료가 필요합니다.'
                  : '各크리에이터に固有のGoogle DriveフォルダーとSlidesガイドを提供してください。キャンペーン別、크리에이터別にすべて異なる資料が必要です。'
                }
              </AlertDescription>
            </Alert>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">
                {language === 'ko' ? '크리에이터 정보' : '크리에이터情報'}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">{language === 'ko' ? '이름:' : '名前:'}</span>
                  <span className="ml-2 font-medium">{selectedCreator?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">{language === 'ko' ? '이메일:' : 'メール:'}</span>
                  <span className="ml-2 font-medium">{selectedCreator?.email}</span>
                </div>
                <div>
                  <span className="text-gray-600">{language === 'ko' ? 'Instagram:' : 'Instagram:'}</span>
                  <span className="ml-2 font-medium">{selectedCreator?.instagram_handle || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">{language === 'ko' ? 'TikTok:' : 'TikTok:'}</span>
                  <span className="ml-2 font-medium">{selectedCreator?.tiktok_handle || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="google_drive_url" className="text-base font-medium">
                  <Folder className="h-5 w-5 inline mr-2 text-blue-600" />
                  {language === 'ko' ? '전용 Google Drive 업로드 폴더' : '専用Google Drive업로드フォルダー'}
                </Label>
                <Input
                  id="google_drive_url"
                  value={materialForm.google_drive_url}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, google_drive_url: e.target.value }))}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="h-12"
                />
                <p className="text-xs text-gray-600">
                  {language === 'ko' 
                    ? '이 크리에이터가 촬영한 영상과 이미지를 업로드할 전용 폴더 링크'
                    : 'この크리에이터が撮影した動画と画像を업로드する専用フォルダーリンク'
                  }
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="google_slides_url" className="text-base font-medium">
                  <FileText className="h-5 w-5 inline mr-2 text-orange-600" />
                  {language === 'ko' ? '개별 맞춤 가이드라인 (Google Slides)' : '個別カスタムガイドライン (Google Slides)'}
                </Label>
                <Input
                  id="google_slides_url"
                  value={materialForm.google_slides_url}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, google_slides_url: e.target.value }))}
                  placeholder="https://docs.google.com/presentation/..."
                  className="h-12"
                />
                <p className="text-xs text-gray-600">
                  {language === 'ko' 
                    ? '이 크리에이터만을 위한 맞춤형 촬영 가이드라인 및 지시사항'
                    : 'この크리에이터専用のカスタム撮影ガイドラインと指示事項'
                  }
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="additional_notes" className="text-base font-medium">
                  {language === 'ko' ? '개별 특별 지시사항' : '個別特別指示事項'}
                </Label>
                <textarea
                  id="additional_notes"
                  value={materialForm.additional_notes}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, additional_notes: e.target.value }))}
                  placeholder={language === 'ko' 
                    ? '이 크리에이터에게만 적용되는 특별한 요청사항이나 주의사항을 입력하세요...'
                    : 'この크리에이터にのみ適用される特別なリクエストや注意事項を入力してください...'
                  }
                  className="w-full h-24 p-3 border rounded-md resize-none"
                />
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h5 className="font-medium text-yellow-800 mb-2">
                {language === 'ko' ? '⚠️ 중요 안내' : '⚠️ 重要なお知らせ'}
              </h5>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• {language === 'ko' ? '각 크리에이터마다 고유한 Drive 폴더를 생성하세요' : '各크리에이터に固有のDriveフォルダーを作成してください'}</li>
                <li>• {language === 'ko' ? '가이드라인은 크리에이터의 SNS 특성에 맞게 개별 작성하세요' : 'ガイドラインは크리에이터のSNS特性に合わせて個別に作成してください'}</li>
                <li>• {language === 'ko' ? '링크는 해당 크리에이터만 접근 가능하도록 권한을 설정하세요' : 'リンクは該当크리에이터のみアクセス可能になるよう権限を설정してください'}</li>
              </ul>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleSaveMaterials}
                disabled={processing || (!materialForm.google_drive_url && !materialForm.google_slides_url)}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {language === 'ko' ? '저장' : '저장'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setMaterialModal(false)
                  resetForm()
                }}
              >
                <X className="h-4 w-4 mr-2" />
                {language === 'ko' ? '취소' : '취소'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CreatorMaterialsManager
