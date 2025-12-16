import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const MinimalSignup = () => {
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.name) {
      setError('すべてのフィールドを入力してください。')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません。')
      return
    }

    if (formData.password.length < 6) {
      setError('パスワードは6文字以上である必要があります。')
      return
    }

    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name
          }
        }
      })
      
      if (error) {
        console.error('Signup error:', error)
        if (error.message.includes('already registered')) {
          setError('すでに登録されているメールアドレスです。')
        } else {
          setError('会員登録中にエラーが発生しました: ' + error.message)
        }
        return
      }
      
      setSuccess(true)
    } catch (error) {
      console.error('Signup error:', error)
      setError('会員登録中にエラーが発生しました。再度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      setLoading(true)
      setError('')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error('Google signup error:', error)
        setError('Google会員登録中にエラーが発生しました: ' + error.message)
      }
    } catch (error) {
      console.error('Google signup error:', error)
      setError('Google会員登録中にエラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        padding: '20px'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '40px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📧</div>
          <h2 style={{ color: '#1F2937', marginBottom: '16px', fontWeight: '600' }}>
            이메일 확인이 필요합니다
          </h2>
          <p style={{ color: '#6B7280', marginBottom: '30px', lineHeight: '1.5' }}>
            회원가입이 완료되었습니다!<br />이메일을 확인하여 계정을 활성화해주세요.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              onClick={() => navigate('/login')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6366F1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              로그인 페이지로
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '40px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#333', marginBottom: '8px' }}>会員登録</h1>
          <p style={{ color: '#666' }}>CNEC Japanへようこそ</p>
        </div>
        
        {error && (
          <div style={{ 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            padding: '12px', 
            borderRadius: '4px', 
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>
              名前 *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="お名前を入力してください"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>
              メールアドレス *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="example@email.com"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>
              パスワード *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="6文字以上のパスワード"
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>
              パスワード確認 *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="パスワードを再入力してください"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: loading ? '#ccc' : '#007bff', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '15px'
            }}
          >
            {loading ? '登録中...' : '会員登録'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{ color: '#666' }}>または</span>
        </div>

        <button 
          onClick={handleGoogleSignup}
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '12px', 
            backgroundColor: loading ? '#ccc' : '#db4437', 
            color: 'white', 
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '20px'
          }}
        >
          {loading ? '処理中...' : 'Googleで登録'}
        </button>

        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#666' }}>すでにアカウントをお持ちですか？ </span>
          <button 
            onClick={() => navigate('/login')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#007bff', 
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ログイン
          </button>
        </div>
      </div>
    </div>
  )
}

export default MinimalSignup
