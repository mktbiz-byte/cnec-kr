import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const BrandEditPage = () => {
  const { brandId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [brand, setBrand] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    logo_url: '',
  });

  useEffect(() => {
    if (user && brandId) {
      loadBrandData();
    }
  }, [user, brandId]);

  const loadBrandData = async () => {
    try {
      setLoading(true);
      setError('');

      // 브랜드 정보 조회
      const { data, error } = await supabase
        .from('brands')
        .select(`
          *,
          corporate_accounts(*)
        `)
        .eq('id', brandId)
        .single();

      if (error) throw error;

      // 권한 확인 (자신의 브랜드인지)
      if (data.corporate_accounts.auth_user_id !== user.id) {
        navigate('/company/brands');
        return;
      }

      setBrand(data);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        website: data.website || '',
        logo_url: data.logo_url || '',
      });
    } catch (err) {
      console.error('브랜드 정보 로드 오류:', err);
      setError('브랜드 정보를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // 브랜드명 필수 입력 확인
      if (!formData.name.trim()) {
        setError('브랜드명은 필수 입력 항목입니다.');
        setSaving(false);
        return;
      }

      // 브랜드 정보 업데이트
      const { error } = await supabase
        .from('brands')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim(),
          website: formData.website.trim(),
          logo_url: formData.logo_url.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', brandId);

      if (error) throw error;

      setSuccess('브랜드 정보가 성공적으로 업데이트되었습니다.');
      loadBrandData(); // 최신 정보로 갱신
    } catch (err) {
      console.error('브랜드 정보 업데이트 오류:', err);
      setError('브랜드 정보 업데이트에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 크기 제한 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('로고 이미지는 2MB 이하여야 합니다.');
      return;
    }

    // 이미지 파일 형식 확인
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 파일명 생성 (브랜드ID_타임스탬프.확장자)
      const fileExt = file.name.split('.').pop();
      const fileName = `${brandId}_${Date.now()}.${fileExt}`;
      const filePath = `brands/${fileName}`;

      // Storage에 파일 업로드
      const { error: uploadError } = await supabase.storage
        .from('brand_logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 파일 URL 가져오기
      const { data } = supabase.storage
        .from('brand_logos')
        .getPublicUrl(filePath);

      // 브랜드 정보에 로고 URL 업데이트
      setFormData(prev => ({ ...prev, logo_url: data.publicUrl }));
    } catch (err) {
      console.error('로고 업로드 오류:', err);
      setError('로고 이미지 업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-4">로딩 중...</div>;
  }

  if (!brand) {
    return <div className="text-center p-4">브랜드 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <button
          className="mr-4"
          onClick={() => navigate('/company/brands')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="page-title">브랜드 정보 수정</h1>
      </div>

      {error && <div className="error-message mb-4">{error}</div>}
      {success && <div className="success-message mb-4">{success}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">브랜드명 <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">브랜드 설명</label>
            <textarea
              id="description"
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="website">웹사이트</label>
            <input
              type="url"
              id="website"
              name="website"
              className="form-control"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://"
            />
          </div>

          <div className="form-group">
            <label htmlFor="logo">브랜드 로고</label>
            {formData.logo_url && (
              <div className="mb-2">
                <img
                  src={formData.logo_url}
                  alt="브랜드 로고"
                  className="h-20 object-contain"
                />
              </div>
            )}
            <input
              type="file"
              id="logo"
              name="logo"
              className="form-control"
              accept="image/*"
              onChange={handleLogoUpload}
            />
            <small className="text-gray-500">최대 2MB, 권장 크기: 200x200px</small>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="btn-secondary mr-2"
              onClick={() => navigate('/company/brands')}
              disabled={saving}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrandEditPage;
