import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGlobe, FaChevronDown } from 'react-icons/fa';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: '中文', flag: '🇹🇼' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
    // 언어 설정을 로컬 스토리지에 저장
    localStorage.setItem('i18nextLng', code);
  };

  return (
    <div className="relative">
      <button
        className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaGlobe className="text-gray-600" />
        <span className="mx-1">{currentLanguage.flag}</span>
        <span className="hidden md:inline">{currentLanguage.name}</span>
        <FaChevronDown className="text-gray-600 text-xs" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
          <ul className="py-1">
            {languages.map((language) => (
              <li key={language.code}>
                <button
                  className={`flex items-center w-full text-left px-4 py-2 hover:bg-gray-100 ${
                    i18n.language === language.code ? 'bg-gray-50 font-medium' : ''
                  }`}
                  onClick={() => changeLanguage(language.code)}
                >
                  <span className="mr-2">{language.flag}</span>
                  {language.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
