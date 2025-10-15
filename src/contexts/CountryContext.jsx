import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import countryService from '../services/countryService';

// 국가 컨텍스트 생성
const CountryContext = createContext();

// 국가 컨텍스트 제공자 컴포넌트
export const CountryProvider = ({ children }) => {
  const { t } = useTranslation();
  const [countries, setCountries] = useState([]);
  const [activeCountries, setActiveCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryStats, setCountryStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 국가 목록 로드
  useEffect(() => {
    const loadCountries = async () => {
      try {
        setLoading(true);
        const allCountries = await countryService.getAllCountries();
        const activeCountriesData = await countryService.getActiveCountries();
        
        setCountries(allCountries);
        setActiveCountries(activeCountriesData);
        
        // 기본 선택 국가 설정 (한국)
        if (activeCountriesData.length > 0 && !selectedCountry) {
          const defaultCountry = activeCountriesData.find(c => c.code === 'kr') || activeCountriesData[0];
          setSelectedCountry(defaultCountry);
        }
        
        setError(null);
      } catch (err) {
        console.error('국가 목록 로드 오류:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCountries();
  }, []);

  // 국가별 통계 로드
  useEffect(() => {
    const loadCountryStats = async () => {
      try {
        setLoading(true);
        const stats = await countryService.getCountryCampaignStats();
        setCountryStats(stats);
        setError(null);
      } catch (err) {
        console.error('국가별 통계 로드 오류:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCountryStats();
  }, []);

  // 국가 선택
  const selectCountry = (countryCode) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      return true;
    }
    return false;
  };

  // 국가별 캠페인 목록 조회
  const getCampaignsByCountry = async (countryCode, filters = {}) => {
    try {
      setLoading(true);
      const campaigns = await countryService.getCampaignsByCountry(countryCode, filters);
      setError(null);
      return campaigns;
    } catch (err) {
      console.error('국가별 캠페인 목록 조회 오류:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 통합 캠페인 목록 조회
  const getIntegratedCampaigns = async (filters = {}) => {
    try {
      setLoading(true);
      const result = await countryService.getIntegratedCampaigns(filters);
      setError(null);
      return result;
    } catch (err) {
      console.error('통합 캠페인 목록 조회 오류:', err);
      setError(err.message);
      return { data: [], count: 0 };
    } finally {
      setLoading(false);
    }
  };

  // 캠페인 생성 (국가별 설정 적용)
  const createCampaign = async (campaignData, countryCode) => {
    try {
      setLoading(true);
      const campaign = await countryService.createCampaign(campaignData, countryCode);
      toast.success(t('campaign.createSuccess'));
      setError(null);
      return campaign;
    } catch (err) {
      console.error('캠페인 생성 오류:', err);
      toast.error(t('campaign.createFailed'));
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 국가별 결제 방법 조회
  const getCountryPaymentMethods = async (countryCode) => {
    try {
      setLoading(true);
      const paymentMethods = await countryService.getCountryPaymentMethods(countryCode);
      setError(null);
      return paymentMethods;
    } catch (err) {
      console.error('국가별 결제 방법 조회 오류:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 국가별 통화 포맷
  const formatCurrency = async (amount, countryCode) => {
    return await countryService.formatCurrency(amount, countryCode);
  };

  // 국가별 세금 계산
  const calculateTax = async (amount, countryCode) => {
    return await countryService.calculateTax(amount, countryCode);
  };

  // 제공할 컨텍스트 값
  const value = {
    countries,
    activeCountries,
    selectedCountry,
    countryStats,
    loading,
    error,
    selectCountry,
    getCampaignsByCountry,
    getIntegratedCampaigns,
    createCampaign,
    getCountryPaymentMethods,
    formatCurrency,
    calculateTax
  };

  return (
    <CountryContext.Provider value={value}>
      {children}
    </CountryContext.Provider>
  );
};

// 국가 컨텍스트 사용 훅
export const useCountry = () => {
  const context = useContext(CountryContext);
  if (context === undefined) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
};

export default CountryContext;
