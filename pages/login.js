import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Login() {
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, remember }),
    })
    if (res.ok) {
      router.push('/')
    } else {
      setError('비밀번호가 틀렸습니다')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f5f5f5', fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif"
    }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '360px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔗</div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111' }}>eeun-link</h1>
          <p style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>관리자 로그인</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              width: '100%', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px',
              fontSize: '14px', outline: 'none', boxSizing: 'border-box', marginBottom: '12px'
            }}
            required
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#111' }}
            />
            <span style={{ fontSize: '13px', color: '#555' }}>이 기기에 비밀번호 저장하기</span>
          </label>
          {error && <p style={{ color: '#e53e3e', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', background: '#111', color: '#fff',
            border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer'
          }}>
            {loading ? '확인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
