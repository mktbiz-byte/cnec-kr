import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CreatorLayout from './CreatorLayout'
import {
  ArrowLeft, Search, UserCheck, Package, Video, Upload, Coins,
  ChevronRight, CheckCircle, Star, Award, Crown, Sparkles,
  ShoppingBag, Calendar, Repeat
} from 'lucide-react'

const TABS = [
  { id: 'flow', label: '활동 플로우' },
  { id: 'types', label: '캠페인 유형' },
  { id: 'points', label: '포인트·등급' }
]

const FLOW_STEPS = [
  {
    icon: Search, color: 'purple',
    title: '캠페인 탐색',
    desc: '홈 화면이나 캠페인 탭에서 모집 중인 캠페인을 확인하세요.',
    tip: '마감일(D-day)과 모집 인원을 꼭 확인하세요.'
  },
  {
    icon: UserCheck, color: 'blue',
    title: '캠페인 지원',
    desc: '캠페인 상세 페이지에서 지원서를 작성하고 제출합니다.',
    tip: '프로필(SNS 계정, 주소, 연락처)을 미리 완성해두세요.'
  },
  {
    icon: CheckCircle, color: 'emerald',
    title: '선정 발표',
    desc: '선정 시 알림톡이 발송되며, 마이페이지 > 지원 내역에서 확인할 수 있습니다.',
    tip: '미선정 시에도 다른 캠페인에 재지원 가능합니다.'
  },
  {
    icon: Package, color: 'amber',
    title: '제품 수령 & 촬영',
    desc: '배송된 제품을 받고 캠페인 가이드(AI 가이드)에 맞춰 촬영을 진행합니다.',
    tip: '클린본(자막/효과 없는 원본)도 함께 준비하세요.'
  },
  {
    icon: Video, color: 'red',
    title: '영상 제출',
    desc: '편집본과 클린본을 업로드합니다. 기업 검수 후 승인 또는 수정 요청이 올 수 있습니다.',
    tip: '수정 요청 시 재업로드하면 됩니다. (V1 → V2 → ...)'
  },
  {
    icon: Upload, color: 'pink',
    title: 'SNS 업로드',
    desc: '영상이 승인되면 SNS에 게시하고, 업로드 URL과 광고코드를 제출합니다.',
    tip: '반드시 영상 승인 후에 SNS에 업로드하세요.'
  },
  {
    icon: Coins, color: 'violet',
    title: '포인트 지급',
    desc: '관리자 확인 후 포인트가 적립됩니다. 적립된 포인트는 출금 신청이 가능합니다.',
    tip: '출금은 최소 10,000원부터 가능합니다.'
  }
]

const CAMPAIGN_TYPES = [
  {
    type: '기획형',
    color: 'blue',
    icon: Video,
    badge: '기본',
    desc: '가장 기본적인 캠페인 형태입니다. 하나의 영상을 제작하고 SNS에 1회 업로드합니다.',
    details: [
      { label: '영상 제출', value: '편집본 1개 + 클린본 1개' },
      { label: 'SNS 업로드', value: '1회 (URL + 광고코드)' },
      { label: '일정', value: '단일 마감일 기준' },
      { label: '광고코드', value: '1개' }
    ]
  },
  {
    type: '올리브영',
    color: 'emerald',
    icon: ShoppingBag,
    badge: '3단계',
    desc: '올리브영 전용 캠페인으로 3단계에 걸쳐 SNS에 업로드합니다.',
    details: [
      { label: '영상 제출', value: '편집본 2개 + 클린본 2개' },
      { label: '1단계', value: '릴스 업로드 + 광고코드' },
      { label: '2단계', value: '릴스 업로드 + 광고코드' },
      { label: '3단계', value: '스토리 업로드 (광고코드 없음)' },
      { label: '일정', value: '단계별 마감일' }
    ]
  },
  {
    type: '4주 챌린지',
    color: 'violet',
    icon: Calendar,
    badge: '4주간',
    desc: '4주 동안 매주 콘텐츠를 제작하고 업로드하는 챌린지형 캠페인입니다.',
    details: [
      { label: '영상 제출', value: '주차별 편집본 + 클린본 (최대 4세트)' },
      { label: 'SNS 업로드', value: '매주 1회 (총 4회)' },
      { label: '광고코드', value: '주차별 1개 (총 4개)' },
      { label: '일정', value: '주차별 마감일 (1~4주차)' }
    ]
  }
]

const COMPARE_ROWS = [
  { label: '영상 수', planned: '1개', oliveyoung: '2개', challenge: '최대 4개' },
  { label: 'SNS 업로드', planned: '1회', oliveyoung: '3회', challenge: '4회' },
  { label: '광고코드', planned: '1개', oliveyoung: '2개', challenge: '4개' },
  { label: '클린본', planned: '1개', oliveyoung: '2개', challenge: '최대 4개' },
  { label: '마감 구조', planned: '단일', oliveyoung: '3단계', challenge: '주차별' }
]

const GRADES = [
  { name: 'FRESH', label: '새싹 크리에이터', color: 'emerald', condition: '가입 시', benefit: '기본 캠페인 지원' },
  { name: 'GLOW', label: '빛나기 시작', color: 'blue', condition: '점수 40+ / 캠페인 3+', benefit: '추천 크리에이터 노출' },
  { name: 'BLOOM', label: '본격 성장', color: 'violet', condition: '점수 60+ / 캠페인 10+', benefit: '큐레이션 캠페인 접근' },
  { name: 'ICONIC', label: '브랜드가 찾는', color: 'pink', condition: '점수 80+ / 캠페인 30+', benefit: '맞춤형 캠페인 제안' },
  { name: 'MUSE', label: '크넥 대표 뮤즈', color: 'amber', condition: '점수 95+ / 캠페인 50+', benefit: 'AI 가이드 + 전용 혜택' }
]

const colorMap = {
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', line: 'bg-purple-200' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', line: 'bg-blue-200' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', line: 'bg-emerald-200' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', line: 'bg-amber-200' },
  red: { bg: 'bg-red-100', text: 'text-red-500', line: 'bg-red-200' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-500', line: 'bg-pink-200' },
  violet: { bg: 'bg-violet-100', text: 'text-violet-600', line: 'bg-violet-200' }
}

const typeBgMap = {
  blue: { card: 'bg-blue-50 border-blue-200', badge: 'bg-blue-500', dot: 'bg-blue-100 text-blue-600' },
  emerald: { card: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-500', dot: 'bg-emerald-100 text-emerald-600' },
  violet: { card: 'bg-violet-50 border-violet-200', badge: 'bg-violet-500', dot: 'bg-violet-100 text-violet-600' }
}

export default function CreatorGuidePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('flow')

  return (
    <CreatorLayout>
      <div className="px-5 pt-5 pb-8">
        {/* 헤더 */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-3xl p-6 text-white relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-white/80 text-sm mb-3 hover:text-white"
          >
            <ArrowLeft size={16} />
            뒤로가기
          </button>

          <p className="text-purple-200 text-xs font-medium mb-1">CNEC CREATOR GUIDE</p>
          <h1 className="text-xl font-bold mb-1">크리에이터 활동 가이드</h1>
          <p className="text-purple-200 text-sm">캠페인 지원부터 포인트 지급까지 한눈에</p>
        </div>

        {/* 탭 */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                  : 'bg-white text-gray-600 border border-gray-100 shadow-sm'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === 'flow' && <FlowTab />}
        {activeTab === 'types' && <TypesTab />}
        {activeTab === 'points' && <PointsTab navigate={navigate} />}
      </div>
    </CreatorLayout>
  )
}

/* ─── 탭 1: 활동 플로우 ─── */
function FlowTab() {
  return (
    <div className="space-y-0">
      {FLOW_STEPS.map((step, idx) => {
        const c = colorMap[step.color]
        const Icon = step.icon
        const isLast = idx === FLOW_STEPS.length - 1

        return (
          <div key={idx} className="flex gap-3">
            {/* 타임라인 */}
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={c.text} />
              </div>
              {!isLast && <div className={`w-0.5 flex-1 ${c.line} my-1`} />}
            </div>

            {/* 카드 */}
            <div className={`flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${isLast ? 'mb-0' : 'mb-2'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold ${c.text}`}>STEP {idx + 1}</span>
                <h3 className="font-bold text-gray-900 text-sm">{step.title}</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-2">{step.desc}</p>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">TIP</span> {step.tip}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── 탭 2: 캠페인 유형 ─── */
function TypesTab() {
  return (
    <div className="space-y-4">
      {CAMPAIGN_TYPES.map((ct, idx) => {
        const tb = typeBgMap[ct.color]
        const Icon = ct.icon

        return (
          <div key={idx} className={`rounded-2xl border p-4 ${tb.card}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl ${tb.dot} flex items-center justify-center`}>
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">{ct.type}</h3>
                  <span className={`text-xs text-white px-2 py-0.5 rounded-full ${tb.badge}`}>{ct.badge}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">{ct.desc}</p>
            <div className="space-y-1.5">
              {ct.details.map((d, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs text-gray-500 w-20 flex-shrink-0 font-medium">{d.label}</span>
                  <span className="text-xs text-gray-800">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* 비교표 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 text-sm mb-3">한눈에 비교</h3>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-1 text-gray-500 font-medium w-20"></th>
                <th className="text-center py-2 px-1 text-blue-600 font-bold">기획형</th>
                <th className="text-center py-2 px-1 text-emerald-600 font-bold">올리브영</th>
                <th className="text-center py-2 px-1 text-violet-600 font-bold">4주챌린지</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row, i) => (
                <tr key={i} className={i < COMPARE_ROWS.length - 1 ? 'border-b border-gray-50' : ''}>
                  <td className="py-2 px-1 text-gray-500 font-medium">{row.label}</td>
                  <td className="py-2 px-1 text-center text-gray-800">{row.planned}</td>
                  <td className="py-2 px-1 text-center text-gray-800">{row.oliveyoung}</td>
                  <td className="py-2 px-1 text-center text-gray-800">{row.challenge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ─── 탭 3: 포인트·등급 ─── */
function PointsTab({ navigate }) {
  return (
    <div className="space-y-4">
      {/* 포인트 출금 안내 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Coins size={20} className="text-violet-600" />
          <h3 className="font-bold text-gray-900">포인트 출금 안내</h3>
        </div>

        <div className="space-y-3">
          <div className="bg-violet-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-violet-700 mb-2">출금 절차</p>
            <div className="space-y-2">
              {[
                '마이페이지 > 계좌 정보에서 출금 계좌 등록',
                '출금 신청 시 주민등록번호 입력 (원천징수용)',
                '관리자 확인 후 3~5 영업일 내 입금'
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-violet-200 text-violet-700 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-xs text-gray-700">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">최소 출금</p>
              <p className="text-sm font-bold text-gray-900">10,000원</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">원천징수</p>
              <p className="text-sm font-bold text-gray-900">3.3%</p>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-3">
            <p className="text-xs text-amber-800 leading-relaxed">
              <span className="font-semibold">참고:</span> 포인트는 캠페인 완료(SNS 업로드 확인) 후 관리자가 지급합니다. 지급된 포인트는 마이페이지에서 확인 가능합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 등급 안내 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Award size={20} className="text-purple-600" />
          <h3 className="font-bold text-gray-900">크리에이터 등급</h3>
        </div>

        <div className="space-y-2">
          {GRADES.map((g, i) => {
            const icons = [Star, Star, Sparkles, Crown, Crown]
            const GIcon = icons[i]

            return (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className={`w-9 h-9 rounded-full bg-${g.color}-100 flex items-center justify-center flex-shrink-0`}>
                  <GIcon size={16} className={`text-${g.color}-600`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{g.name}</span>
                    <span className="text-xs text-gray-500">{g.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{g.condition}</p>
                </div>
                <p className="text-xs text-gray-600 font-medium text-right max-w-[100px]">{g.benefit}</p>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => navigate('/my/grade')}
          className="w-full mt-4 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
        >
          등급 상세 보기 <ChevronRight size={16} />
        </button>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-3">자주 묻는 질문</h3>
        <div className="space-y-3">
          {[
            { q: '클린본이 뭔가요?', a: '자막, 텍스트, 효과 없이 촬영한 원본 영상입니다. 편집본과 별도로 제출해야 합니다.' },
            { q: '수정 요청을 받았는데 어떻게 하나요?', a: '지원 내역에서 해당 캠페인의 영상 제출 페이지로 이동 후 재업로드하면 됩니다. (V1 → V2)' },
            { q: '광고코드는 어디에 입력하나요?', a: 'SNS 업로드 시 URL과 함께 제출합니다. 광고코드는 캠페인 상세 또는 지원 내역에서 확인할 수 있습니다.' },
            { q: '포인트가 지급되지 않아요.', a: '모든 제출물(영상 + 클린본 + SNS URL)이 완료되어야 합니다. 누락된 항목이 없는지 확인해주세요.' }
          ].map((faq, i) => (
            <div key={i} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-gray-900 mb-1">Q. {faq.q}</p>
              <p className="text-xs text-gray-600 leading-relaxed">A. {faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
