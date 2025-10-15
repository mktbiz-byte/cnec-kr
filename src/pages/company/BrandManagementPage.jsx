import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

const BrandManagementPage = () => {
  const { user } = useAuth();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [companyInfo, setCompanyInfo] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  // 회사 정보 및 브랜드 목록 로드
  useEffect(() => {
    if (user) {
      loadCompanyInfo();
      loadBrands();
    }
  }, [user]);

  const loadCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('corporate_accounts')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (error) throw error;
      setCompanyInfo(data);
    } catch (err) {
      console.error('회사 정보 로드 오류:', err);
      setError('회사 정보를 불러오는 데 실패했습니다.');
    }
  };

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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBrands(data || []);
    } catch (err) {
      console.error('브랜드 목록 로드 오류:', err);
      setError('브랜드 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    setSuccess('');

    try {
      // 브랜드명 필수 입력 확인
      if (!formData.name.trim()) {
        setError('브랜드명은 필수 입력 항목입니다.');
        setFormLoading(false);
        return;
      }

      // 브랜드 추가
      const { data, error } = await supabase
        .from('brands')
        .insert([{
          corporate_account_id: companyInfo.id,
          name: formData.name.trim(),
          description: formData.description.trim(),
          website: formData.website.trim(),
        }])
        .select();

      if (error) throw error;

      // 성공 메시지 표시 및 폼 초기화
      setSuccess('브랜드가 성공적으로 추가되었습니다.');
      setFormData({ name: '', description: '', website: '' });
      setShowAddForm(false);
      
      // 브랜드 목록 새로고침
      loadBrands();
    } catch (err) {
      console.error('브랜드 추가 오류:', err);
      setError('브랜드 추가에 실패했습니다.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteBrand = async (brandId) => {
    if (!window.confirm('정말로 이 브랜드를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', brandId);

      if (error) throw error;

      setSuccess('브랜드가 성공적으로 삭제되었습니다.');
      loadBrands();
    } catch (err) {
      console.error('브랜드 삭제 오류:', err);
      setError('브랜드 삭제에 실패했습니다.');
    }
  };

  const toggleBrandStatus = async (brand) => {
    try {
      setError('');
      setSuccess('');

      const { error } = await supabase
        .from('brands')
        .update({ is_active: !brand.is_active })
        .eq('id', brand.id);

      if (error) throw error;

      setSuccess(`브랜드가 ${!brand.is_active ? '활성화' : '비활성화'}되었습니다.`);
      loadBrands();
    } catch (err) {
      console.error('브랜드 상태 변경 오류:', err);
      setError('브랜드 상태 변경에 실패했습니다.');
    }
  };

  if (loading) {
    return <div className="text-center p-4">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">브랜드 관리</h1>
        <button
          className="btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '취소' : '브랜드 추가'}
        </button>
      </div>

      {error && <div className="error-message mb-4">{error}</div>}
      {success && <div className="success-message mb-4">{success}</div>}

      {showAddForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">새 브랜드 추가</h2>
          <form onSubmit={handleAddBrand}>
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
            
            <div className="flex justify-end">
              <button
                type="button"
                className="btn-secondary mr-2"
                onClick={() => setShowAddForm(false)}
                disabled={formLoading}
              >
                취소
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={formLoading}
              >
                {formLoading ? '저장 중...' : '브랜드 추가'}
              </button>
            </div>
          </form>
        </div>
      )}

      {brands.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-gray-500">등록된 브랜드가 없습니다.</p>
          <p className="mt-2">
            <button
              className="text-blue-600 hover:underline"
              onClick={() => setShowAddForm(true)}
            >
              첫 브랜드를 추가해보세요!
            </button>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map(brand => (
            <div key={brand.id} className={`card ${!brand.is_active ? 'opacity-70' : ''}`}>
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold">{brand.name}</h3>
                <div className="flex">
                  <button
                    className={`px-2 py-1 text-xs rounded mr-2 ${brand.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                    onClick={() => toggleBrandStatus(brand)}
                  >
                    {brand.is_active ? '활성' : '비활성'}
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800"
                    onClick={() => handleDeleteBrand(brand.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {brand.description && (
                <p className="text-gray-600 text-sm mt-2">{brand.description}</p>
              )}
              
              {brand.website && (
                <p className="text-sm mt-2">
                  <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {brand.website}
                  </a>
                </p>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  to={`/company/brands/${brand.id}/edit`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  브랜드 정보 수정
                </Link>
                <span className="mx-2 text-gray-300">|</span>
                <Link
                  to={`/company/brands/${brand.id}/campaigns`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  캠페인 관리
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrandManagementPage;
