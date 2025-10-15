import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

// 컴포넌트 및 UI 요소
import { Button } from '../../components/common/Button';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: ''
  });
  
  const [formStatus, setFormStatus] = useState({
    submitted: false,
    success: false,
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 폼 유효성 검사
    if (!formData.name || !formData.email || !formData.message) {
      setFormStatus({
        submitted: true,
        success: false,
        message: '이름, 이메일, 메시지는 필수 입력 항목입니다.'
      });
      return;
    }
    
    try {
      // 실제 구현에서는 API 호출로 대체
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      
      // 성공 시뮬레이션
      setTimeout(() => {
        setFormStatus({
          submitted: true,
          success: true,
          message: '문의가 성공적으로 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.'
        });
        
        // 폼 초기화
        setFormData({
          name: '',
          email: '',
          company: '',
          phone: '',
          message: ''
        });
      }, 1000);
      
    } catch (error) {
      setFormStatus({
        submitted: true,
        success: false,
        message: '문의 접수 중 오류가 발생했습니다. 다시 시도해 주세요.'
      });
    }
  };

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
              문의하기
            </motion.h1>
            <motion.p 
              className="text-xl max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              CNEC Business에 대해 궁금한 점이 있으시면 언제든지 문의해 주세요.
            </motion.p>
          </div>
        </Container>
      </Section>

      {/* 연락처 정보 및 문의 폼 섹션 */}
      <Section className="py-16">
        <Container>
          <div className="grid md:grid-cols-3 gap-8">
            {/* 연락처 정보 */}
            <div className="md:col-span-1">
              <h2 className="text-2xl font-bold mb-6">연락처 정보</h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <FaEnvelope className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">이메일</h3>
                    <p className="mt-1 text-gray-600">info@cnecbiz.com</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <FaPhone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">전화</h3>
                    <p className="mt-1 text-gray-600">02-1234-5678</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <FaMapMarkerAlt className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">주소</h3>
                    <p className="mt-1 text-gray-600">서울특별시 강남구 테헤란로 123 CNEC빌딩 4층</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">업무 시간</h3>
                <p className="text-gray-600 mb-2">월요일 - 금요일: 9:00 - 18:00</p>
                <p className="text-gray-600">토요일, 일요일, 공휴일: 휴무</p>
              </div>
            </div>
            
            {/* 문의 폼 */}
            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold mb-6">문의하기</h2>
              
              {formStatus.submitted && (
                <div className={`p-4 mb-6 rounded-md ${formStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {formStatus.message}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      이름 *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      이메일 *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                      회사명
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      전화번호
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    문의 내용 *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  ></textarea>
                </div>
                
                <div>
                  <Button type="submit" variant="primary" size="lg" className="w-full md:w-auto">
                    문의하기
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Container>
      </Section>

      {/* 지도 섹션 */}
      <Section className="py-8">
        <Container>
          <div className="bg-gray-200 h-96 rounded-lg overflow-hidden">
            {/* 실제 구현 시 Google Maps 또는 Kakao Maps API 연동 */}
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-gray-500">지도가 표시될 영역입니다.</p>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
};

export default ContactPage;
