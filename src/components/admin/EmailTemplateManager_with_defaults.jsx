import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import AdminNavigation from './AdminNavigation';
import database from '../../lib/supabase';

const EmailTemplateManager = () => {
  const { language } = useLanguage();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // 기본 메일 템플릿들
  const defaultTemplates = [
    {
      id: 'welcome',
      name: language === 'ja' ? '会員登録완료メール' : '회원가입 완료 메일',
      subject: language === 'ja' ? 'CNEC Korea へようこそ！' : 'CNEC Korea에 오신 것을 환영합니다!',
      content: language === 'ja' ? 
        `こんにちは {{name}} さん、

CNEC Korea へのご登録ありがとうございます！

あなたのアカウントが正常に作成されました。
これからK-Beautyブランドの最新キャンペーンに参加して、あなたの影響力を収益化しましょう。

ご質問がございましたら、いつでもお気軽にお問い合わせください。

CNEC Korea チーム` :
        `안녕하세요 {{name}}님,

CNEC Korea에 가입해주셔서 감사합니다!

계정이 성공적으로 생성되었습니다.
이제 K-Beauty 브랜드의 최신 캠페인에 참여하여 여러분의 영향력을 수익화해보세요.

궁금한 점이 있으시면 언제든지 문의해주세요.

CNEC Korea 팀`,
      variables: ['name', 'email'],
      category: 'user'
    },
    {
      id: 'campaign_approved',
      name: language === 'ja' ? 'キャンペーン승인通知' : '캠페인 승인 알림',
      subject: language === 'ja' ? '🎉 キャンペーンに選ばれました！' : '🎉 캠페인에 선정되셨습니다!',
      content: language === 'ja' ? 
        `おめでとうございます {{name}} さん！

「{{campaign_title}}」キャンペーンに選ばれました！

キャンペーン상세:
- ブランド: {{brand_name}}
- 보상: ₩{{reward_amount}}
- 締切: {{deadline}}

次のステップ:
1. 添付のガイドラインをご확인ください
2. コンテンツ制作を開始してください
3. 期限内に投稿を완료してください

ガイドライン: {{guidelines_url}}
업로드フォルダ: {{upload_folder}}

頑張ってください！

CNEC Korea チーム` :
        `축하합니다 {{name}}님!

「{{campaign_title}}」 캠페인에 선정되셨습니다!

캠페인 상세정보:
- 브랜드: {{brand_name}}
- 보상금: ₩{{reward_amount}}
- 마감일: {{deadline}}

다음 단계:
1. 첨부된 가이드라인을 확인해주세요
2. 콘텐츠 제작을 시작해주세요
3. 기한 내에 게시를 완료해주세요

가이드라인: {{guidelines_url}}
업로드 폴더: {{upload_folder}}

화이팅!

CNEC Korea 팀`,
      variables: ['name', 'campaign_title', 'brand_name', 'reward_amount', 'deadline', 'guidelines_url', 'upload_folder'],
      category: 'campaign'
    },
    {
      id: 'campaign_rejected',
      name: language === 'ja' ? 'キャンペーン不採用通知' : '캠페인 불합격 알림',
      subject: language === 'ja' ? 'キャンペーン선발結果について' : '캠페인 선정 결과 안내',
      content: language === 'ja' ? 
        `{{name}} さん、

「{{campaign_title}}」キャンペーンにご지원いただき、ありがとうございました。

慎重に検討させていただきましたが、今回は他の지원者を選ばせていただくことになりました。

今回はご期待に添えず申し訳ございませんが、今後も新しいキャンペーンを随時公開予定ですので、ぜひまたご지원ください。

あなたのクリエイティブな活動を応援しています。

CNEC Korea チーム` :
        `{{name}}님,

「{{campaign_title}}」 캠페인에 지원해주셔서 감사합니다.

신중히 검토한 결과, 이번에는 다른 지원자를 선정하게 되었습니다.

이번에는 기대에 부응하지 못해 죄송하지만, 앞으로도 새로운 캠페인을 지속적으로 공개할 예정이니 다시 지원해주시기 바랍니다.

여러분의 창의적인 활동을 응원합니다.

CNEC Korea 팀`,
      variables: ['name', 'campaign_title'],
      category: 'campaign'
    },
    {
      id: 'withdrawal_approved',
      name: language === 'ja' ? '출금승인通知' : '출금 승인 알림',
      subject: language === 'ja' ? '💰 출금申請が승인されました' : '💰 출금 신청이 승인되었습니다',
      content: language === 'ja' ? 
        `{{name}} さん、

출금申請が승인されました！

출금상세:
- 金額: ₩{{amount}}
- 振込先: {{bank_info}}
- 処理日: {{process_date}}

通常、승인後 3-5営業日以内にお客様の口座に振り込まれます。

ご不明な点がございましたら、お気軽にお問い合わせください。

CNEC Korea チーム` :
        `{{name}}님,

출금 신청이 승인되었습니다!

출금 상세정보:
- 금액: ₩{{amount}}
- 입금 계좌: {{bank_info}}
- 처리일: {{process_date}}

일반적으로 승인 후 3-5 영업일 내에 고객님의 계좌로 입금됩니다.

궁금한 점이 있으시면 언제든지 문의해주세요.

CNEC Korea 팀`,
      variables: ['name', 'amount', 'bank_info', 'process_date'],
      category: 'financial'
    },
    {
      id: 'campaign_deadline',
      name: language === 'ja' ? 'キャンペーン締切リマインダー' : '캠페인 마감 리마인더',
      subject: language === 'ja' ? '⏰ キャンペーン締切が近づいています' : '⏰ 캠페인 마감이 임박했습니다',
      content: language === 'ja' ? 
        `{{name}} さん、

「{{campaign_title}}」キャンペーンの締切が近づいています。

締切: {{deadline}}
残り時間: {{time_remaining}}

まだ投稿を완료していない場合は、お早めに投稿をお願いいたします。

投稿要건:
{{requirements}}

ご質問がございましたら、お気軽にお問い合わせください。

CNEC Korea チーム` :
        `{{name}}님,

「{{campaign_title}}」 캠페인의 마감이 임박했습니다.

마감일: {{deadline}}
남은 시간: {{time_remaining}}

아직 게시를 완료하지 않으셨다면, 서둘러 게시해주시기 바랍니다.

게시 요구사항:
{{requirements}}

궁금한 점이 있으시면 언제든지 문의해주세요.

CNEC Korea 팀`,
      variables: ['name', 'campaign_title', 'deadline', 'time_remaining', 'requirements'],
      category: 'reminder'
    }
  ];

  // 다국어 텍스트
  const texts = {
    ko: {
      title: '이메일 템플릿 관리',
      description: '시스템에서 사용되는 이메일 템플릿을 관리합니다.',
      templateList: '템플릿 목록',
      editTemplate: '템플릿 편집',
      templateName: '템플릿 이름',
      subject: '제목',
      content: '내용',
      variables: '사용 가능한 변수',
      category: '카테고리',
      save: '저장',
      cancel: '취소',
      edit: '편집',
      preview: '미리보기',
      reset: '기본값으로 초기화',
      categories: {
        user: '사용자',
        campaign: '캠페인',
        financial: '금융',
        reminder: '알림'
      },
      messages: {
        saved: '템플릿이 저장되었습니다.',
        error: '저장 중 오류가 발생했습니다.',
        reset: '기본값으로 초기화되었습니다.'
      }
    },
    ja: {
      title: '이메일 템플릿管理',
      description: 'システムで使用される이메일 템플릿を管理します。',
      templateList: 'テンプレート목록',
      editTemplate: 'テンプレート편집',
      templateName: 'テンプレート名',
      subject: '건名',
      content: '内容',
      variables: '使用可能な変数',
      category: 'カテゴリ',
      save: '저장',
      cancel: '취소',
      edit: '편집',
      preview: 'プレビュー',
      reset: 'デフォルトに戻す',
      categories: {
        user: 'ユーザー',
        campaign: 'キャンペーン',
        financial: '金融',
        reminder: 'リマインダー'
      },
      messages: {
        saved: 'テンプレートが저장されました。',
        error: '저장中に오류가 발생했습니다。',
        reset: 'デフォルト値に戻されました。'
      }
    }
  };

  const t = texts[language] || texts.ko;

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      // 저장된 템플릿 로드 시도
      const savedTemplates = await database.emailTemplates?.getAll?.() || [];
      
      // 저장된 템플릿이 없으면 기본 템플릿 사용
      if (savedTemplates.length === 0) {
        setTemplates(defaultTemplates);
        // 기본 템플릿을 데이터베이스에 저장
        await saveDefaultTemplates();
      } else {
        setTemplates(savedTemplates);
      }
    } catch (error) {
      console.error('템플릿 로드 오류:', error);
      // 오류 발생 시 기본 템플릿 사용
      setTemplates(defaultTemplates);
    } finally {
      setLoading(false);
    }
  };

  const saveDefaultTemplates = async () => {
    try {
      for (const template of defaultTemplates) {
        await database.emailTemplates?.create?.(template);
      }
    } catch (error) {
      console.error('기본 템플릿 저장 오류:', error);
    }
  };

  const handleEdit = (template) => {
    setSelectedTemplate({ ...template });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    try {
      setSaving(true);
      
      // 데이터베이스에 저장
      await database.emailTemplates?.upsert?.(selectedTemplate);
      
      // 로컬 상태 업데이트
      setTemplates(prev => 
        prev.map(t => t.id === selectedTemplate.id ? selectedTemplate : t)
      );
      
      setMessage(t.messages.saved);
      setIsEditing(false);
      setSelectedTemplate(null);
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('템플릿 저장 오류:', error);
      setMessage(t.messages.error);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = (templateId) => {
    const defaultTemplate = defaultTemplates.find(t => t.id === templateId);
    if (defaultTemplate) {
      setSelectedTemplate({ ...defaultTemplate });
      setMessage(t.messages.reset);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedTemplate(null);
  };

  const getCategoryColor = (category) => {
    const colors = {
      user: 'bg-blue-100 text-blue-800',
      campaign: 'bg-green-100 text-green-800',
      financial: 'bg-yellow-100 text-yellow-800',
      reminder: 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
            <p className="mt-2 text-gray-600">{t.description}</p>
          </div>

          {/* 메시지 */}
          {message && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 템플릿 목록 */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">{t.templateList}</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {templates.map((template) => (
                  <div key={template.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {template.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {template.subject}
                        </p>
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                            {t.categories[template.category]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => handleEdit(template)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          {t.edit}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 템플릿 편집 */}
            {isEditing && selectedTemplate && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">{t.editTemplate}</h2>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* 템플릿 이름 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t.templateName}
                    </label>
                    <input
                      type="text"
                      value={selectedTemplate.name}
                      onChange={(e) => setSelectedTemplate(prev => ({
                        ...prev,
                        name: e.target.value
                      }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>

                  {/* 제목 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t.subject}
                    </label>
                    <input
                      type="text"
                      value={selectedTemplate.subject}
                      onChange={(e) => setSelectedTemplate(prev => ({
                        ...prev,
                        subject: e.target.value
                      }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>

                  {/* 내용 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t.content}
                    </label>
                    <textarea
                      rows={12}
                      value={selectedTemplate.content}
                      onChange={(e) => setSelectedTemplate(prev => ({
                        ...prev,
                        content: e.target.value
                      }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>

                  {/* 사용 가능한 변수 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.variables}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.variables?.map((variable) => (
                        <span
                          key={variable}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 cursor-pointer hover:bg-gray-200"
                          onClick={() => {
                            const textarea = document.querySelector('textarea');
                            const cursorPos = textarea.selectionStart;
                            const textBefore = selectedTemplate.content.substring(0, cursorPos);
                            const textAfter = selectedTemplate.content.substring(cursorPos);
                            const newContent = textBefore + `{{${variable}}}` + textAfter;
                            setSelectedTemplate(prev => ({
                              ...prev,
                              content: newContent
                            }));
                          }}
                        >
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 버튼들 */}
                  <div className="flex justify-between">
                    <button
                      onClick={() => handleReset(selectedTemplate.id)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      {t.reset}
                    </button>
                    
                    <div className="space-x-3">
                      <button
                        onClick={handleCancel}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        {t.cancel}
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                      >
                        {saving ? '저장 중...' : t.save}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateManager;
