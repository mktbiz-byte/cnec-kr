import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// 컴포넌트 및 UI 요소
import { Button } from '../../components/common/Button';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';

// 아이콘 및 이미지
import { FaChartLine, FaUsers, FaGlobe, FaCheckCircle } from 'react-icons/fa';
import corporateLogo from '../../assets/images/corporate-logo.png';

const CorporateHomePage = () => {
  return (
    <div className="bg-white">
      {/* 히어로 섹션 */}
      <Section className="bg-gradient-to-r from-blue-600 to-indigo-800 text-white py-20">
        <Container>
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <motion.h1 
                className="text-4xl md:text-5xl font-bold mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                CNEC Business
              </motion.h1>
              <motion.p 
                className="text-xl mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                한국 기업과 크리에이터를 연결하는 마케팅 플랫폼
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Button 
                  as={Link} 
                  to="/auth/register" 
                  variant="white"
                  className="text-blue-600 hover:bg-gray-100"
                >
                  기업 회원가입
                </Button>
                <Button 
                  as={Link} 
                  to="/auth/login" 
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-blue-600"
                >
                  로그인
                </Button>
              </motion.div>
            </div>
            <motion.div 
              className="md:w-1/2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <img 
                src={corporateLogo} 
                alt="CNEC Business" 
                className="w-full max-w-md mx-auto"
              />
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* 서비스 소개 섹션 */}
      <Section className="py-20">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">서비스 소개</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              CNEC Business는 기업과 크리에이터를 연결하여 효과적인 마케팅 캠페인을 진행할 수 있도록 돕습니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <FaChartLine className="h-10 w-10 text-blue-500" />,
                title: '효과적인 마케팅',
                description: '타겟 고객에게 직접 도달하는 인플루언서 마케팅으로 브랜드 인지도와 매출을 높이세요.'
              },
              {
                icon: <FaUsers className="h-10 w-10 text-blue-500" />,
                title: '검증된 크리에이터',
                description: '엄선된 크리에이터 네트워크를 통해 브랜드에 적합한 인플루언서를 만나보세요.'
              },
              {
                icon: <FaGlobe className="h-10 w-10 text-blue-500" />,
                title: '글로벌 확장',
                description: '한국을 넘어 일본, 미국, 대만 등 글로벌 시장으로 브랜드를 확장하세요.'
              }
            ].map((item, index) => (
              <motion.div 
                key={index}
                className="bg-white p-8 rounded-lg shadow-lg text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* 프로세스 섹션 */}
      <Section className="py-20 bg-gray-50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">캠페인 진행 프로세스</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              간단한 4단계로 효과적인 인플루언서 마케팅 캠페인을 시작하세요.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: '회원가입',
                description: '기업 정보를 등록하고 계정을 생성합니다.'
              },
              {
                step: '02',
                title: '캠페인 생성',
                description: '브랜드와 제품에 맞는 캠페인을 설계합니다.'
              },
              {
                step: '03',
                title: '결제 및 승인',
                description: '캠페인 비용을 결제하고 관리자 승인을 받습니다.'
              },
              {
                step: '04',
                title: '결과 확인',
                description: '캠페인 성과를 실시간으로 모니터링합니다.'
              }
            ].map((item, index) => (
              <motion.div 
                key={index}
                className="relative"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="bg-white p-8 rounded-lg shadow-md relative z-10">
                  <div className="text-3xl font-bold text-blue-500 mb-4">{item.step}</div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 right-0 w-full h-1 bg-blue-200 z-0 transform translate-x-1/2">
                    <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500"></div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* 특징 섹션 */}
      <Section className="py-20">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">CNEC Business의 특징</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              다른 마케팅 플랫폼과 차별화된 CNEC Business만의 특별한 가치를 경험하세요.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: '다국적 캠페인 관리',
                description: '한국, 일본, 미국, 대만 등 여러 국가에서 동시에 캠페인을 관리할 수 있습니다.'
              },
              {
                title: '세금계산서 자동 발행',
                description: '캠페인 결제 후 세금계산서를 자동으로 발행받을 수 있습니다.'
              },
              {
                title: '다중 브랜드 지원',
                description: '하나의 기업 계정으로 여러 브랜드를 등록하고 관리할 수 있습니다.'
              },
              {
                title: '상세한 성과 분석',
                description: '캠페인의 성과를 상세하게 분석하여 마케팅 효과를 극대화할 수 있습니다.'
              }
            ].map((item, index) => (
              <motion.div 
                key={index}
                className="flex items-start p-6 bg-white rounded-lg shadow-md"
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="mr-4 mt-1">
                  <FaCheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
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
            <h2 className="text-3xl font-bold mb-6">지금 바로 시작하세요</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              CNEC Business와 함께 효과적인 인플루언서 마케팅으로 브랜드 가치를 높이세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                as={Link} 
                to="/auth/register" 
                variant="white"
                className="text-blue-600 hover:bg-gray-100"
              >
                기업 회원가입
              </Button>
              <Button 
                as={Link} 
                to="/contact" 
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600"
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

export default CorporateHomePage;
