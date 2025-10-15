import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaChartLine, FaUsers, FaGlobe, FaCheckCircle, FaArrowRight } from 'react-icons/fa';

// 컴포넌트 및 UI 요소
import { Button } from '../../components/common/Button';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';

// 가상의 이미지 경로 (실제 구현 시 교체 필요)
import serviceImage1 from '../../assets/images/service-1.jpg';
import serviceImage2 from '../../assets/images/service-2.jpg';
import serviceImage3 from '../../assets/images/service-3.jpg';

const ServicesPage = () => {
  // 서비스 데이터
  const services = [
    {
      id: 1,
      title: '인플루언서 마케팅',
      description: '타겟 고객에게 직접 도달하는 인플루언서 마케팅으로 브랜드 인지도와 매출을 높이세요.',
      features: [
        '타겟 고객층에 맞는 인플루언서 매칭',
        '캠페인 기획 및 실행 지원',
        '성과 측정 및 분석 리포트 제공',
        '다양한 SNS 플랫폼 지원 (인스타그램, 유튜브, 틱톡 등)'
      ],
      image: serviceImage1,
      icon: <FaUsers className="h-10 w-10 text-blue-500" />
    },
    {
      id: 2,
      title: '글로벌 마케팅',
      description: '한국을 넘어 일본, 미국, 대만 등 글로벌 시장으로 브랜드를 확장하세요.',
      features: [
        '국가별 맞춤형 마케팅 전략 수립',
        '현지 인플루언서 네트워크 활용',
        '다국어 콘텐츠 제작 지원',
        '글로벌 시장 진출 컨설팅'
      ],
      image: serviceImage2,
      icon: <FaGlobe className="h-10 w-10 text-blue-500" />
    },
    {
      id: 3,
      title: '브랜드 성과 분석',
      description: '데이터 기반의 마케팅 성과 분석으로 ROI를 극대화하세요.',
      features: [
        '실시간 캠페인 성과 모니터링',
        '상세한 데이터 분석 리포트',
        '경쟁사 벤치마킹 분석',
        '마케팅 전략 최적화 제안'
      ],
      image: serviceImage3,
      icon: <FaChartLine className="h-10 w-10 text-blue-500" />
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
              서비스 소개
            </motion.h1>
            <motion.p 
              className="text-xl max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              CNEC Business는 기업과 크리에이터를 연결하여 효과적인 마케팅 솔루션을 제공합니다.
            </motion.p>
          </div>
        </Container>
      </Section>

      {/* 서비스 개요 섹션 */}
      <Section className="py-16">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">우리의 서비스</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              CNEC Business는 기업의 마케팅 목표 달성을 위한 다양한 서비스를 제공합니다.
              인플루언서 마케팅부터 글로벌 시장 진출까지, 브랜드 성장을 위한 모든 솔루션을 경험하세요.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-16">
            {services.map((service, index) => (
              <motion.div 
                key={service.id}
                className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="md:w-1/2">
                  <div className="bg-gray-200 rounded-lg overflow-hidden h-80">
                    {/* 실제 구현 시 이미지 교체 */}
                    <div className="w-full h-full flex items-center justify-center bg-blue-100">
                      {service.icon}
                      <span className="ml-2 text-xl font-bold text-blue-800">{service.title} 이미지</span>
                    </div>
                  </div>
                </div>
                
                <div className="md:w-1/2">
                  <div className="flex items-center mb-4">
                    {service.icon}
                    <h3 className="text-2xl font-bold ml-3">{service.title}</h3>
                  </div>
                  
                  <p className="text-lg text-gray-600 mb-6">
                    {service.description}
                  </p>
                  
                  <ul className="space-y-3 mb-8">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <FaCheckCircle className="h-5 w-5 text-green-500 mt-1 mr-3" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    as={Link} 
                    to="/auth/register" 
                    variant="primary"
                    className="flex items-center"
                  >
                    서비스 이용하기
                    <FaArrowRight className="ml-2" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* 서비스 비교 섹션 */}
      <Section className="py-16 bg-gray-50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">서비스 비교</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              CNEC Business의 다양한 서비스 옵션을 비교해보세요.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="p-4 text-left">서비스 기능</th>
                  <th className="p-4 text-center">기본 플랜</th>
                  <th className="p-4 text-center">프리미엄 플랜</th>
                  <th className="p-4 text-center">엔터프라이즈 플랜</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="p-4 font-medium">인플루언서 매칭</td>
                  <td className="p-4 text-center">기본 매칭</td>
                  <td className="p-4 text-center">고급 매칭</td>
                  <td className="p-4 text-center">맞춤형 매칭</td>
                </tr>
                <tr className="border-b border-gray-200 bg-gray-100">
                  <td className="p-4 font-medium">캠페인 수</td>
                  <td className="p-4 text-center">월 1회</td>
                  <td className="p-4 text-center">월 5회</td>
                  <td className="p-4 text-center">무제한</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-4 font-medium">성과 분석 리포트</td>
                  <td className="p-4 text-center">기본 리포트</td>
                  <td className="p-4 text-center">상세 리포트</td>
                  <td className="p-4 text-center">맞춤형 리포트</td>
                </tr>
                <tr className="border-b border-gray-200 bg-gray-100">
                  <td className="p-4 font-medium">글로벌 마케팅</td>
                  <td className="p-4 text-center">-</td>
                  <td className="p-4 text-center">2개국 지원</td>
                  <td className="p-4 text-center">모든 국가 지원</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-4 font-medium">전담 매니저</td>
                  <td className="p-4 text-center">-</td>
                  <td className="p-4 text-center">-</td>
                  <td className="p-4 text-center">✓</td>
                </tr>
                <tr className="border-b border-gray-200 bg-gray-100">
                  <td className="p-4 font-medium">콘텐츠 제작 지원</td>
                  <td className="p-4 text-center">-</td>
                  <td className="p-4 text-center">기본 지원</td>
                  <td className="p-4 text-center">전문 지원</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-gray-100">
                  <td className="p-4 font-medium">가격</td>
                  <td className="p-4 text-center font-bold">₩500,000/월</td>
                  <td className="p-4 text-center font-bold">₩1,500,000/월</td>
                  <td className="p-4 text-center font-bold">문의</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="text-center mt-8">
            <Button 
              as={Link} 
              to="/contact" 
              variant="primary"
              size="lg"
            >
              서비스 문의하기
            </Button>
          </div>
        </Container>
      </Section>

      {/* FAQ 섹션 */}
      <Section className="py-16">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">자주 묻는 질문</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              CNEC Business 서비스에 대한 궁금증을 해결해 드립니다.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              {[
                {
                  question: '인플루언서 마케팅은 어떻게 진행되나요?',
                  answer: '기업이 캠페인을 등록하면, CNEC Business가 적합한 인플루언서를 매칭해 드립니다. 인플루언서가 콘텐츠를 제작하고 게시한 후, 성과를 분석하여 리포트를 제공해 드립니다.'
                },
                {
                  question: '어떤 국가에서 서비스를 이용할 수 있나요?',
                  answer: '현재 한국, 일본, 미국, 대만에서 서비스를 제공하고 있으며, 계속해서 서비스 지역을 확장하고 있습니다.'
                },
                {
                  question: '캠페인 비용은 어떻게 책정되나요?',
                  answer: '캠페인 비용은 인플루언서의 영향력, 콘텐츠 유형, 캠페인 기간 등 여러 요소에 따라 달라집니다. 자세한 내용은 문의하기를 통해 상담받으실 수 있습니다.'
                },
                {
                  question: '세금계산서는 어떻게 발행받을 수 있나요?',
                  answer: '캠페인 결제 후 기업 관리자 페이지에서 세금계산서 발행을 요청하실 수 있습니다. 요청 후 영업일 기준 1-2일 내에 발행됩니다.'
                },
                {
                  question: '다중 브랜드 관리는 어떻게 하나요?',
                  answer: '하나의 기업 계정으로 여러 브랜드를 등록하고 관리할 수 있습니다. 기업 관리자 페이지의 브랜드 관리 메뉴에서 브랜드를 추가하고 각 브랜드별로 캠페인을 진행할 수 있습니다.'
                }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-md"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-xl font-bold mb-3">{item.question}</h3>
                  <p className="text-gray-600">{item.answer}</p>
                </motion.div>
              ))}
            </div>
            
            <div className="text-center mt-10">
              <p className="text-gray-600 mb-4">
                더 궁금한 점이 있으신가요?
              </p>
              <Button 
                as={Link} 
                to="/contact" 
                variant="primary"
              >
                문의하기
              </Button>
            </div>
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

export default ServicesPage;
