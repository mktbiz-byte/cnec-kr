import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const TermsPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 ml-2">이용약관</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">CNEC 서비스 이용약관</h2>

          <div className="prose prose-sm text-gray-700 space-y-6">
            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제1조 (목적)</h3>
              <p className="text-sm leading-relaxed">
                이 약관은 주식회사 하우파파(이하 "회사")가 운영하는 CNEC 플랫폼(이하 "서비스")에서 제공하는
                인플루언서 마케팅 서비스의 이용조건 및 절차, 회사와 이용자의 권리, 의무, 책임사항과 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제2조 (정의)</h3>
              <div className="text-sm leading-relaxed space-y-2">
                <p>1. "서비스"란 회사가 제공하는 크리에이터와 브랜드 간의 마케팅 캠페인 연결 플랫폼을 의미합니다.</p>
                <p>2. "크리에이터"란 서비스에 가입하여 캠페인에 참여하는 개인 회원을 의미합니다.</p>
                <p>3. "브랜드"란 서비스를 통해 마케팅 캠페인을 진행하는 기업 회원을 의미합니다.</p>
                <p>4. "캠페인"이란 브랜드가 크리에이터에게 의뢰하는 마케팅 활동을 의미합니다.</p>
                <p>5. "포인트"란 캠페인 완료 시 지급되는 서비스 내 보상 단위를 의미합니다.</p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제3조 (약관의 효력 및 변경)</h3>
              <div className="text-sm leading-relaxed space-y-2">
                <p>1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</p>
                <p>2. 회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</p>
                <p>3. 회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제4조 (회원가입)</h3>
              <div className="text-sm leading-relaxed space-y-2">
                <p>1. 회원가입은 이용자가 약관의 내용에 동의한 후 회원가입신청을 하고, 회사가 이러한 신청에 대해 승낙함으로써 체결됩니다.</p>
                <p>2. 회사는 다음 각 호에 해당하는 신청에 대해서는 승낙을 거부할 수 있습니다:</p>
                <p className="pl-4">- 타인의 명의를 도용한 경우</p>
                <p className="pl-4">- 허위의 정보를 기재한 경우</p>
                <p className="pl-4">- 만 14세 미만인 경우</p>
                <p className="pl-4">- 기타 회사가 정한 이용신청 요건이 충족되지 않은 경우</p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제5조 (서비스의 이용)</h3>
              <div className="text-sm leading-relaxed space-y-2">
                <p>1. 서비스 이용은 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴, 1일 24시간 운영을 원칙으로 합니다.</p>
                <p>2. 회사는 시스템 정기점검, 증설 및 교체를 위해 서비스를 일시적으로 중단할 수 있으며, 이 경우 사전에 공지합니다.</p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제6조 (캠페인 참여)</h3>
              <div className="text-sm leading-relaxed space-y-2">
                <p>1. 크리에이터는 서비스에서 제공하는 캠페인에 자유롭게 지원할 수 있습니다.</p>
                <p>2. 캠페인 선정 여부는 브랜드의 기준에 따라 결정되며, 회사는 선정 결과에 대해 책임지지 않습니다.</p>
                <p>3. 선정된 크리에이터는 캠페인 가이드라인을 준수하여 콘텐츠를 제작해야 합니다.</p>
                <p>4. 캠페인 완료 시 회사가 정한 기준에 따라 포인트가 지급됩니다.</p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제7조 (포인트 및 정산)</h3>
              <div className="text-sm leading-relaxed space-y-2">
                <p>1. 포인트는 캠페인 완료 후 회사의 검수를 거쳐 지급됩니다.</p>
                <p>2. 포인트는 회원이 신청한 계좌로 현금으로 정산받을 수 있습니다.</p>
                <p>3. 정산 시 관련 법령에 따른 세금이 원천징수될 수 있습니다.</p>
                <p>4. 부정한 방법으로 취득한 포인트는 회수될 수 있습니다.</p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제8조 (회원의 의무)</h3>
              <div className="text-sm leading-relaxed space-y-2">
                <p>1. 회원은 다음 행위를 하여서는 안 됩니다:</p>
                <p className="pl-4">- 허위 정보의 등록</p>
                <p className="pl-4">- 타인의 정보 도용</p>
                <p className="pl-4">- 회사가 게시한 정보의 변경</p>
                <p className="pl-4">- 서비스를 이용한 불법 행위</p>
                <p className="pl-4">- 캠페인 가이드라인 위반</p>
                <p className="pl-4">- 기타 관계 법령에 위배되는 행위</p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제9조 (서비스 이용 제한)</h3>
              <div className="text-sm leading-relaxed space-y-2">
                <p>1. 회사는 회원이 이 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우 서비스 이용을 제한할 수 있습니다.</p>
                <p>2. 서비스 이용 제한 시 회사는 회원에게 그 사유를 통지합니다.</p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제10조 (회원 탈퇴)</h3>
              <div className="text-sm leading-relaxed space-y-2">
                <p>1. 회원은 언제든지 서비스 내에서 회원 탈퇴를 신청할 수 있습니다.</p>
                <p>2. 탈퇴 시 진행 중인 캠페인이 있는 경우 해당 캠페인 완료 후 탈퇴가 처리될 수 있습니다.</p>
                <p>3. 탈퇴 시 미정산된 포인트는 정산 신청 후 탈퇴하시기 바랍니다.</p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제11조 (면책조항)</h3>
              <div className="text-sm leading-relaxed space-y-2">
                <p>1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</p>
                <p>2. 회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</p>
                <p>3. 회사는 크리에이터와 브랜드 간의 분쟁에 대해 중재 역할을 할 수 있으나, 최종 책임은 당사자에게 있습니다.</p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제12조 (분쟁해결)</h3>
              <div className="text-sm leading-relaxed space-y-2">
                <p>1. 회사와 회원 간에 발생한 전자상거래 분쟁에 관한 소송은 서울중앙지방법원을 전속 관할 법원으로 합니다.</p>
                <p>2. 회사와 회원 간에 제기된 전자상거래 소송에는 대한민국 법을 적용합니다.</p>
              </div>
            </section>

            <section className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                <strong>부칙</strong><br />
                이 약관은 2024년 1월 1일부터 시행합니다.
              </p>
            </section>
          </div>
        </div>

        {/* 회사 정보 */}
        <div className="mt-8 text-center text-xs text-gray-400 space-y-1">
          <p>주식회사 하우파파 | 대표 박현용</p>
          <p>서울 중구 퇴계로36길 2 동국대학교 충무로 영상센터 1009호</p>
          <p>문의: <a href="https://pf.kakao.com/_TjhGG" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">카카오톡 채널</a></p>
        </div>
      </div>
    </div>
  )
}

export default TermsPage
