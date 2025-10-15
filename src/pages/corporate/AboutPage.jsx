import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaUsers, FaLightbulb, FaHandshake, FaGlobe } from 'react-icons/fa';

// 컴포넌트 및 UI 요소
import { Button } from '../../components/common/Button';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';

// 가상의 이미지 경로 (실제 구현 시 교체 필요)
import aboutImage from '../../assets/images/about-image.jpg';
import teamMember1 from '../../assets/images/team-1.jpg';
import teamMember2 from '../../assets/images/team-2.jpg';
import teamMember3 from '../../assets/images/team-3.jpg';
import partnerLogo1 from '../../assets/images/partner-1.png';
import partnerLogo2 from '../../assets/images/partner-2.png';
import partnerLogo3 from '../../assets/images/partner-3.png';

const AboutPage = () => {
  // 팀 멤버 데이터
  const teamMembers = [
    {
      id: 1,
      name: '김대표',
      position: 'CEO & 창립자',
      bio: '10년 이상의 마케팅 경력을 바탕으로 CNEC Business를 설립했습니다. 글로벌 시장에서의 풍부한 경험을 통해 기업과 크리에이터를 연결하는 새로운 비즈니스 모델을 구축했습니다.',
      image: teamMember1
    },
    {
      id: 2,
      name: '이사업',
      position: '사업 개발 이사',
      bio: '다양한 산업 분야에서의 비즈니스 개발 경험을 가지고 있으며, CNEC Business의 글로벌 확장을 이끌고 있습니다. 특히 일본과 미국 시장에서의 전문성을 보유하고 있습니다.',
      image: teamMember2
    },
    {
      id: 3,
      name: '박마케팅',
      position: '마케팅 이사',
      bio: '디지털 마케팅 전문가로서 인플루언서 마케팅 전략 수립 및 실행을 담당하고 있습니다. 데이터 기반의 마케팅 접근법으로 클라이언트의 ROI를 극대화합니다.',
      image: teamMember3
    }
  ];

  // 연혁 데이터
  const history = [
    {
      year: '2020',
      events: [
        '4월 - CNEC Business 설립',
        '7월 - 한국 시장 서비스 출시',
        '12월 - 첫 100개 캠페인 달성'
      ]
    },
    {
      year: '2021',
      events: [
        '3월 - 일본 시장 진출',
        '6월 - 시리즈 A 투자 유치',
        '9월 - 플랫폼 2.0 버전 출시'
      ]
    },
    {
      year: '2022',
      events: [
        '2월 - 미국 시장 진출',
        '5월 - 등록 크리에이터 1,000명 돌파',
        '11월 - 연간 캠페인 1,000개 달성'
      ]
    },
    {
      year: '2023',
      events: [
        '1월 - 대만 시장 진출',
        '4월 - 시리즈 B 투자 유치',
        '8월 - AI 기반 매칭 시스템 도입',
        '12월 - 글로벌 브랜드 파트너십 100개 달성'
      ]
    },
    {
      year: '2024',
      events: [
        '3월 - 플랫폼 3.0 버전 출시',
        '7월 - 등록 크리에이터 5,000명 돌파'
      ]
    }
  ];

  // 핵심 가치 데이터
  const values = [
    {
      icon: <FaUsers className="h-8 w-8 text-blue-500" />,
      title: '연결',
      description: '기업과 크리에이터 간의 의미 있는 연결을 통해 상호 성장을 도모합니다.'
    },
    {
      icon: <FaLightbulb className="h-8 w-8 text-blue-500" />,
      title: '혁신',
      description: '끊임없는 혁신을 통해 마케팅 산업의 새로운 표준을 제시합니다.'
    },
    {
      icon: <FaHandshake className="h-8 w-8 text-blue-500" />,
      title: '신뢰',
      description: '투명하고 정직한 비즈니스 관행으로 모든 이해관계자와의 신뢰를 구축합니다.'
    },
    {
      icon: <FaGlobe className="h-8 w-8 text-blue-500" />,
      title: '글로벌',
      description: '문화적 다양성을 존중하며 글로벌 시장에서의 성공을 지원합니다.'
    }
  ];

  return (
    <div className="bg-white">
      {/* 헤더 섹션 */}
      <Section className="bg-gradient-to-r from-blue-600 to-indigo-800 text-white py-16">
        <Container>
          <div className="text-center">
            <motion.h1 
              className="text-4xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              회사 소개
            </motion.h1>
            <motion.p 
              className="text-xl max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              기업과 크리에이터를 연결하는 글로벌 마케팅 플랫폼, CNEC Business를 소개합니다.
            </motion.p>
          </div>
        </Container>
      </Section>

      {/* 회사 소개 섹션 */}
      <Section className="py-16">
        <Container>
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <motion.div 
              className="md:w-1/2"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6">우리는 누구인가요?</h2>
              <p className="text-lg text-gray-600 mb-4">
                CNEC Business는 2020년 설립된 글로벌 인플루언서 마케팅 플랫폼입니다. 
                우리는 기업과 크리에이터를 연결하여 효과적인 마케팅 캠페인을 진행할 수 있도록 돕고 있습니다.
              </p>
              <p className="text-lg text-gray-600 mb-4">
                현재 한국, 일본, 미국, 대만 등 여러 국가에서 서비스를 제공하고 있으며, 
                5,000명 이상의 크리에이터와 500개 이상의 기업 파트너와 함께하고 있습니다.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                우리의 미션은 기업과 크리에이터 모두에게 가치 있는 협업 기회를 제공하여 
                디지털 마케팅 생태계의 지속 가능한 성장을 이끄는 것입니다.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">5,000+</div>
                  <div className="text-gray-600">등록 크리에이터</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">500+</div>
                  <div className="text-gray-600">기업 파트너</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">4</div>
                  <div className="text-gray-600">서비스 국가</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">10,000+</div>
                  <div className="text-gray-600">완료된 캠페인</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="md:w-1/2"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="bg-gray-200 rounded-lg overflow-hidden h-96">
                {/* 실제 구현 시 이미지 교체 */}
                <div className="w-full h-full flex items-center justify-center bg-blue-100">
                  <span className="text-xl font-bold text-blue-800">회사 소개 이미지</span>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* 핵심 가치 섹션 */}
      <Section className="py-16 bg-gray-50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">핵심 가치</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              CNEC Business의 모든 활동과 의사결정은 다음의 핵심 가치를 바탕으로 이루어집니다.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div 
                key={index}
                className="bg-white p-8 rounded-lg shadow-md text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex justify-center mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* 연혁 섹션 */}
      <Section className="py-16">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">회사 연혁</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              CNEC Business의 성장 과정을 소개합니다.
            </p>
          </div>

          <div className="relative">
            {/* 타임라인 중앙선 */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-blue-200"></div>
            
            <div className="space-y-12">
              {history.map((period, index) => (
                <motion.div 
                  key={index}
                  className="relative"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                >
                  {/* 연도 표시 */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold z-10">
                    {period.year}
                  </div>
                  
                  {/* 이벤트 내용 */}
                  <div className={`flex ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className="w-1/2"></div>
                    <div className={`w-1/2 ${index % 2 === 0 ? 'pl-12' : 'pr-12'}`}>
                      <div className="bg-white p-6 rounded-lg shadow-md">
                        <ul className="space-y-2">
                          {period.events.map((event, eventIndex) => (
                            <li key={eventIndex} className="flex items-start">
                              <span className="h-2 w-2 rounded-full bg-blue-500 mt-2 mr-2"></span>
                              <span>{event}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* 팀 소개 섹션 */}
      <Section className="py-16 bg-gray-50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">리더십 팀</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              CNEC Business를 이끌어가는 핵심 멤버들을 소개합니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div 
                key={member.id}
                className="bg-white rounded-lg overflow-hidden shadow-md"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="h-64 bg-gray-200">
                  {/* 실제 구현 시 이미지 교체 */}
                  <div className="w-full h-full flex items-center justify-center bg-blue-100">
                    <span className="text-lg font-bold text-blue-800">{member.name} 사진</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                  <p className="text-blue-600 mb-4">{member.position}</p>
                  <p className="text-gray-600">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* 파트너 섹션 */}
      <Section className="py-16">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">파트너사</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              CNEC Business와 함께하는 글로벌 파트너사들입니다.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item, index) => (
              <motion.div 
                key={index}
                className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-32"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                {/* 실제 구현 시 로고 이미지 교체 */}
                <div className="text-center">
                  <span className="text-lg font-bold text-gray-400">파트너사 {item}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA 섹션 */}
      <Section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-800 text-white">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">함께 성장하세요</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              CNEC Business와 함께 글로벌 마케팅의 새로운 가능성을 경험하세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                as={Link} 
                to="/auth/register" 
                variant="white"
                className="text-blue-600 hover:bg-gray-100"
                size="lg"
              >
                기업 회원가입
              </Button>
              <Button 
                as={Link} 
                to="/contact" 
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600"
                size="lg"
              >
                문의하기
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
};

export default AboutPage;
