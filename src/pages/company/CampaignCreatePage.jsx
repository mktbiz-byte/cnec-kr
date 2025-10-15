import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatters';

const CampaignCreatePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [brands, setBrands] = useState([]);
  const [formData, setFormData] = useState({
    brand_id: '',
    title: '',
    description: '',
    reward_amount: '',
    target_platforms: {
      instagram: false,
      tiktok: false,
      youtube: false,
      blog: false,
    },
    requirements: '',
    start_date: '',
    end_date: '',
    max_creators: '',
  });

  useEffect(() => {
    if (user) {
      loadBrands();
    }
  }, [user]);

  const loadBrands = async () => {
    try {
      setLoading(true);
      setError('');

      // 먼저 회사 ID 조회
      const { data: companyData, error: companyError } = await supabase
        .from('corporate_accounts')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (companyError) throw companyError;

      // 회사 ID로 브랜드 목록 조회
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('corporate_account_id', companyData.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBrands(data || []);

      // 브랜드가 있으면 첫 번째 브랜드를 기본 선택
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, brand_id: data[0].id }));
      }
    } catch (err) {
      console.error('브랜드 목록 로드 오류:', err);
      setError('브랜드 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const platform = name.split('_')[1]; // target_instagram -> instagram
      setFormData(prev => ({
        ...prev,
        target_platforms: {
          ...prev.target_platforms,
          [platform]: e.target.checked
        }
      }));
    } else if (name === 'reward_amount') {
      // 숫자만 입력 가능하도록
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // 필수 입력 확인
      if (!formData.brand_id) {
        setError('브랜드를 선택해주세요.');
        setSaving(false);
        return;
      }

      if (!formData.title.trim()) {
        setError('캠페인 제목을 입력해주세요.');
        setSaving(false);
        return;
      }

      if (!formData.reward_amount) {
        setError('보상 금액을 입력해주세요.');
        setSaving(false);
        return;
      }

      if (!formData.start_date || !formData.end_date) {
        setError('캠페인 시작일과 종료일을 입력해주세요.');
        setSaving(false);
        return;
      }

      // 시작일이 종료일보다 이후인지 확인
      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        setError('캠페인 시작일은 종료일보다 이전이어야 합니다.');
        setSaving(false);
        return;
      }

      // 회사 ID 조회
      const { data: companyData, error: companyError } = await supabase
        .from('corporate_accounts')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (companyError) throw companyError;

      // 캠페인 생성
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{
          corporate_account_id: companyData.id,
          brand_id: formData.brand_id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          reward_amount: parseInt(formData.reward_amount),
          target_platforms: formData.target_platforms,
          requirements: formData.requirements.trim(),
          start_date: formData.start_date,
          end_date: formData.end_date,
          max_creators: formData.max_creators ? parseInt(formData.max_creators) : null,
          status: 'draft',
        }])
        .select();

      if (error) throw error;

      // 성공 시 캠페인 상세 페이지로 이동
      navigate(`/company/campaigns/${data[0].id}`);
    } catch (err) {
      console.error('캠페인 생성 오류:', err);
      setError('캠페인 생성에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center p-4">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <button
          className="mr-4"
          onClick={() => navigate('/company/campaigns')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="page-title">새 캠페인 생성</h1>
      </div>

      {error && <div className="error-message mb-4">{error}</div>}

      {brands.length === 0 ? (
        <div className="card p-6">
          <p className="text-center">캠페인을 생성하려면 먼저 브랜드를 등록해야 합니다.</p>
          <div className="flex justify-center mt-4">
            <button
              className="btn-primary"
              onClick={() => navigate('/company/brands')}
            >
              브랜드 관리로 이동
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="brand_id">브랜드 선택 <span className="text-red-500">*</span></label>
              <select
                id="brand_id"
                name="brand_id"
                className="form-control"
                value={formData.brand_id}
                onChange={handleInputChange}
                required
              >
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="title">캠페인 제목 <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="title"
                name="title"
                className="form-control"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">캠페인 설명</label>
              <textarea
                id="description"
                name="description"
                className="form-control"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reward_amount">보상 금액 (JPY) <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="reward_amount"
                name="reward_amount"
                className="form-control"
                value={formData.reward_amount ? formatCurrency(formData.reward_amount) : ''}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>대상 플랫폼</label>
              <div className="flex flex-wrap gap-4 mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="target_instagram"
                    checked={formData.target_platforms.instagram}
                    onChange={handleInputChange}
                    className="form-checkbox"
                  />
                  <span className="ml-2">Instagram</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="target_tiktok"
                    checked={formData.target_platforms.tiktok}
                    onChange={handleInputChange}
                    className="form-checkbox"
                  />
                  <span className="ml-2">TikTok</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="target_youtube"
                    checked={formData.target_platforms.youtube}
                    onChange={handleInputChange}
                    className="form-checkbox"
                  />
                  <span className="ml-2">YouTube</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="target_blog"
                    checked={formData.target_platforms.blog}
                    onChange={handleInputChange}
                    className="form-checkbox"
                  />
                  <span className="ml-2">Blog</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="requirements">참여 요구사항</label>
              <textarea
                id="requirements"
                name="requirements"
                className="form-control"
                value={formData.requirements}
                onChange={handleInputChange}
                rows="3"
                placeholder="크리에이터에게 요구하는 사항을 입력하세요."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="start_date">시작일 <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  className="form-control"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="end_date">종료일 <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  className="form-control"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="max_creators">최대 참여 크리에이터 수</label>
              <input
                type="number"
                id="max_creators"
                name="max_creators"
                className="form-control"
                value={formData.max_creators}
                onChange={handleInputChange}
                min="1"
                placeholder="제한 없음"
              />
              <small className="text-gray-500">비워두면 제한 없음</small>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="btn-secondary mr-2"
                onClick={() => navigate('/company/campaigns')}
                disabled={saving}
              >
                취소
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving ? '저장 중...' : '캠페인 생성'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CampaignCreatePage;
