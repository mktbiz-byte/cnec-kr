import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Eye, ArrowRight, GraduationCap, Handshake, TrendingUp, Video, Award, DollarSign, Target, Star, CheckCircle } from 'lucide-react';

const HomePageImproved = () => {
  const [activeCampaignTab, setActiveCampaignTab] = useState('all');

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 네비게이션 */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <img src="/cnec-logo.png" alt="CNEC Korea" className="h-12" />
          </Link>
          <div className="flex items-center gap-6">
            <a href="#campaigns" className="text-gray-700 hover:text-blue-600 font-medium">캠페인</a>
            <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium">서비스소개</a>
            <a href="#programs" className="text-gray-700 hover:text-blue-600 font-medium">프로그램</a>
            <a href="#faq" className="text-gray-700 hover:text-blue-600 font-medium">FAQ</a>
            <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium">로그인</Link>
            <Link to="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700">회원가입</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 히어로 섹션 - 개선됨 */}
      <section className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          {/* 로고 */}
          <div className="mb-6">
            <img src="/cnec-logo.png" alt="CNEC Korea" className="h-24 mx-auto filter drop-shadow-2xl" />
            <p className="text-xl mt-3 font-semibold tracking-wide">K-뷰티와 크리에이터를 연결합니다</p>
          </div>

          {/* 메인 헤드라인 */}
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            K-Beauty 크리에이터와 함께
            <br />
            <span className="text-yellow-300">성장하는</span> 플랫폼
          </h1>

          {/* 서브 헤드라인 */}
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-4xl mx-auto">
            뷰티 크리에이터를 육성하고 양성하며,
            <br />
            브랜드와 함께 성장하는 전문 파트너십 플랫폼
          </p>

          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
              asChild
            >
              <Link to="/signup">
                <Users className="h-6 w-6 mr-2" />
                크리에이터 등록하기
              </Link>
            </Button>
            <Button 
              size="lg" 
              className="bg-yellow-400 text-gray-900 hover:bg-yellow-500 text-lg px-8 py-6"
              asChild
            >
              <a href="#programs">
                <ArrowRight className="h-6 w-6 mr-2" />
                프로그램 알아보기
              </a>
            </Button>
          </div>

          {/* 핵심 가치 3가지 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <GraduationCap className="h-12 w-12 mx-auto mb-3 text-yellow-300" />
              <h3 className="text-xl font-bold mb-2">체계적인 교육</h3>
              <p className="text-sm opacity-90">뷰티 콘텐츠 제작 노하우 전수</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <Handshake className="h-12 w-12 mx-auto mb-3 text-yellow-300" />
              <h3 className="text-xl font-bold mb-2">브랜드 파트너십</h3>
              <p className="text-sm opacity-90">100+ 뷰티 브랜드와 직접 협업</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 text-yellow-300" />
              <h3 className="text-xl font-bold mb-2">성장 지원</h3>
              <p className="text-sm opacity-90">유튜브 채널 육성 프로그램</p>
            </div>
          </div>
        </div>
      </section>

      {/* 서비스 소개 섹션 - 개선됨 */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">CNEC Korea란?</h2>
          <p className="text-xl text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            K-뷰티 크리에이터를 육성하고 양성하는 전문 플랫폼입니다.
            <br />
            브랜드와 크리에이터가 함께 성장하며, 지속 가능한 파트너십을 구축합니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1: 크리에이터 육성 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <GraduationCap className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">크리에이터 육성</h3>
              <p className="text-gray-700 mb-4">
                체계적인 교육 프로그램과 멘토링을 통해
                초보 크리에이터도 전문가로 성장할 수 있도록 지원합니다.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>콘텐츠 제작 교육</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>1:1 멘토링</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>성공 사례 공유</span>
                </li>
              </ul>
            </div>

            {/* Feature 2: 브랜드 파트너십 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="bg-purple-600 text-white rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Handshake className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">브랜드 파트너십</h3>
              <p className="text-gray-700 mb-4">
                100개 이상의 K-뷰티 브랜드와 직접 협업하며,
                크리에이터에게 다양한 기회를 제공합니다.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>브랜드 직접 매칭</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>장기 계약 기회</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>독점 캠페인 참여</span>
                </li>
              </ul>
            </div>

            {/* Feature 3: 성장 지원 시스템 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">성장 지원 시스템</h3>
              <p className="text-gray-700 mb-4">
                유튜브 채널 육성부터 소속 크리에이터 프로그램까지,
                단계별 성장을 체계적으로 지원합니다.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>유튜브 육성 프로그램</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>소속 크리에이터 혜택</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>포인트 추가 지급</span>
                </li>
              </ul>
            </div>

            {/* Feature 4: 숏폼 콘텐츠 전문 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="bg-orange-600 text-white rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Video className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">숏폼 콘텐츠 전문</h3>
              <p className="text-gray-700 mb-4">
                TikTok, Instagram Reels, YouTube Shorts 등
                숏폼 플랫폼에 최적화된 콘텐츠 제작을 지원합니다.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>숏폼 트렌드 분석</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>편집 가이드 제공</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>바이럴 전략 공유</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 신규 프로그램 섹션 */}
      <section id="programs" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">크리에이터 성장 프로그램</h2>
          <p className="text-xl text-center text-gray-600 mb-12">
            CNEC와 함께 뷰티 크리에이터로 성장하세요.
            <br />
            단계별 프로그램으로 체계적인 성장을 지원합니다.
          </p>

          {/* 프로그램 1: 유튜브 육성 프로그램 */}
          <div className="mb-16 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-10 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-600 text-white rounded-full px-4 py-2 font-bold">🏆 인기 프로그램</div>
            </div>
            <h3 className="text-3xl font-bold mb-4">유튜브 육성 프로그램</h3>
            <p className="text-lg text-gray-700 mb-6">
              뷰티 전문 유튜브 채널을 함께 성장시키는
              CNEC의 대표 프로그램입니다.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Star className="h-6 w-6 text-yellow-500" />
                  프로그램 혜택
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">💰</span>
                    <div>
                      <strong className="text-lg">100만 포인트 지원</strong>
                      <p className="text-sm text-gray-600">초기 채널 운영 자금 전액 지원</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">📦</span>
                    <div>
                      <strong className="text-lg">제품비 100% 지원</strong>
                      <p className="text-sm text-gray-600">리뷰용 뷰티 제품 무제한 제공</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🎓</span>
                    <div>
                      <strong className="text-lg">체계적인 교육</strong>
                      <p className="text-sm text-gray-600">콘텐츠 기획, 촬영, 편집 전문 교육</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">👥</span>
                    <div>
                      <strong className="text-lg">1:1 멘토링</strong>
                      <p className="text-sm text-gray-600">성공한 크리에이터의 노하우 전수</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <strong className="text-lg">채널 성장 전략</strong>
                      <p className="text-sm text-gray-600">알고리즘 분석 및 최적화 지원</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-bold mb-4">지원 자격</h4>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>뷰티에 관심이 많은 크리에이터</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>주 3회 이상 콘텐츠 업로드 가능</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>6개월 이상 장기 활동 의지</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>구독자 수 무관 (초보 환영)</span>
                  </li>
                </ul>

                <div className="bg-white rounded-lg p-6 shadow-md">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-bold text-red-600">50+</div>
                      <div className="text-sm text-gray-600">참여 크리에이터</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-red-600">평균 5만+</div>
                      <div className="text-sm text-gray-600">구독자 성장</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-red-600">6개월+</div>
                      <div className="text-sm text-gray-600">프로그램 기간</div>
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-6 bg-red-600 hover:bg-red-700 text-lg py-6">
                  유튜브 육성 프로그램 지원하기 →
                </Button>
              </div>
            </div>
          </div>

          {/* 계속... */}
        </div>
      </section>

      {/* 나머지 섹션은 다음 파일에서 계속 */}
    </div>
  );
};

export default HomePageImproved;

