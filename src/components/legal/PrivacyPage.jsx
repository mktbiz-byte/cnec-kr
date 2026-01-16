import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const PrivacyPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 ml-2">개인정보처리방침</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">CNEC 개인정보처리방침</h2>

          <div className="prose prose-sm text-gray-700 space-y-6">
            <p className="text-sm leading-relaxed">
              주식회사 하우파파(이하 "회사")는 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고
              개인정보와 관련한 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.
            </p>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제1조 (개인정보의 처리 목적)</h3>
              <div className="text-sm leading-relaxed space-y-2">
                <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
                <p className="pl-4">1. 회원 가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지</p>
                <p className="pl-4">2. 서비스 제공: 캠페인 매칭 서비스 제공, 콘텐츠 제공, 맞춤서비스 제공</p>
                <p className="pl-4">3. 마케팅 및 광고 활용: 신규 서비스 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공</p>
                <p className="pl-4">4. 정산: 캠페인 완료에 따른 포인트 지급 및 현금 정산</p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제2조 (수집하는 개인정보의 항목)</h3>
              <div className="text-sm leading-relaxed space-y-2">
                <p><strong>1. 필수 수집 항목</strong></p>
                <p className="pl-4">- 회원가입 시: 이메일, 비밀번호, 이름(닉네임)</p>
                <p className="pl-4">- 캠페인 참여 시: 연락처, 배송지 주소</p>
                <p className="pl-4">- 정산 신청 시: 은행명, 계좌번호, 예금주명</p>
                <p className="mt-2"><strong>2. 선택 수집 항목</strong></p>
                <p className="pl-4">- 프로필 정보: 프로필 사진, 나이, 피부타입, 관심 카테고리</p>
                <p className="pl-4">- SNS 정보: 인스타그램/유튜브/틱톡 계정 URL 및 팔로워 수</p>
                <p className="pl-4">- 채널 정보: 대표 채널명, 평균 조회수, 타겟 오디언스</p>
                <p className="mt-2"><strong>3. 자동 수집 항목</strong></p>
                <p className="pl-4">- 서비스 이용 기록, 접속 로그, 접속 IP 정보, 쿠키</p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제3조 (개인정보의 처리 및 보유 기간)</h3>
              <div className="text-sm leading-relaxed space-y-2">
                <p>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
                <p className="pl-4">1. 회원 정보: 회원 탈퇴 시까지 (단, 관계 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 보존)</p>
                <p className="pl-4">2. 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</p>
                <p className="pl-4">3. 대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</p>
                <p className="pl-4">4. 소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</p>
                <p className="pl-4">5. 웹사이트 방문기록: 3개월 (통신비밀보호법)</p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제4조 (개인정보의 제3자 제공)</h3>
              <div className="text-sm leading-relaxed space-y-2">
                <p>회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.</p>
                <p className="pl-4">1. 이용자가 사전에 동의한 경우</p>
                <p className="pl-4">2. 캠페인 진행을 위해 브랜드사에 제공하는 경우 (크리에이터 프로필 정보)</p>
                <p className="pl-4">3. 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제5조 (개인정보처리의 위탁)</h3>
              <div className="text-sm leading-relaxed space-y-2">
                <p>회사는 서비스 제공을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
                <p className="pl-4">- 클라우드 서비스: Supabase (데이터베이스 및 인증 서비스)</p>
                <p className="pl-4">- 이메일 발송: 이메일 발송 서비스 제공업체</p>
                <p>위탁업무의 내용이나 수탁자가 변경될 경우에는 지체없이 본 개인정보 처리방침을 통하여 공개하도록 하겠습니다.</p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제6조 (정보주체의 권리·의무 및 행사방법)</h3>
              <div className="text-sm leading-relaxed space-y-2">
                <p>이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.</p>
                <p className="pl-4">1. 개인정보 열람 요구</p>
                <p className="pl-4">2. 오류 등이 있을 경우 정정 요구</p>
                <p className="pl-4">3. 삭제 요구</p>
                <p className="pl-4">4. 처리정지 요구</p>
                <p>권리 행사는 회사에 대해 서면, 이메일 등을 통하여 할 수 있으며, 회사는 이에 대해 지체없이 조치하겠습니다.</p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제7조 (개인정보의 파기)</h3>
              <div className="text-sm leading-relaxed space-y-2">
                <p>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
                <p><strong>파기절차</strong>: 불필요한 개인정보는 개인정보관리책임자의 승인을 받아 파기합니다.</p>
                <p><strong>파기방법</strong>: 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.</p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제8조 (개인정보의 안전성 확보 조치)</h3>
              <div className="text-sm leading-relaxed space-y-2">
                <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
                <p className="pl-4">1. 개인정보 취급 직원의 최소화 및 교육</p>
                <p className="pl-4">2. 개인정보에 대한 접근 제한</p>
                <p className="pl-4">3. 개인정보의 암호화</p>
                <p className="pl-4">4. 해킹 등에 대비한 기술적 대책</p>
                <p className="pl-4">5. 접속기록의 보관 및 위변조 방지</p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제9조 (개인정보 보호책임자)</h3>
              <div className="text-sm leading-relaxed space-y-2 bg-gray-50 rounded-xl p-4">
                <p><strong>개인정보 보호책임자</strong></p>
                <p>성명: 이지훈</p>
                <p>직책: 개인정보관리책임자</p>
                <p>이메일: howpapa@howpapa.co.kr</p>
                <p className="mt-3 text-gray-500">
                  이용자는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을
                  개인정보 보호책임자에게 문의하실 수 있습니다. 회사는 이용자의 문의에 대해 지체 없이 답변 및 처리해드릴 것입니다.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제10조 (개인정보 열람청구)</h3>
              <div className="text-sm leading-relaxed space-y-2">
                <p>이용자는 개인정보 보호법 제35조에 따른 개인정보의 열람 청구를 아래의 부서에 할 수 있습니다.</p>
                <p className="pl-4">- 담당부서: 고객지원팀</p>
                <p className="pl-4">- 문의: 카카오톡 채널 (@cnec)</p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제11조 (권익침해 구제방법)</h3>
              <div className="text-sm leading-relaxed space-y-2">
                <p>이용자는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에 분쟁해결이나 상담 등을 신청할 수 있습니다.</p>
                <p className="pl-4">- 개인정보분쟁조정위원회: (국번없이) 1833-6972</p>
                <p className="pl-4">- 개인정보침해신고센터: privacy.kisa.or.kr / (국번없이) 118</p>
                <p className="pl-4">- 대검찰청: www.spo.go.kr / (국번없이) 1301</p>
                <p className="pl-4">- 경찰청: ecrm.cyber.go.kr / (국번없이) 182</p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-gray-900 mb-2">제12조 (개인정보 처리방침 변경)</h3>
              <div className="text-sm leading-relaxed">
                <p>이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>
              </div>
            </section>

            <section className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                <strong>부칙</strong><br />
                이 개인정보처리방침은 2024년 1월 1일부터 시행합니다.
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

export default PrivacyPage
