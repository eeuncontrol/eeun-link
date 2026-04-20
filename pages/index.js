import { useState, useEffect } from 'react'
import { parse } from 'cookie'

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : ''

export async function getServerSideProps({ req }) {
  const cookies = parse(req.headers.cookie || '')
  if (cookies.auth !== 'ok') {
    return { redirect: { destination: '/login', permanent: false } }
  }
  return { props: {} }
}

export default function Home() {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ original_url: '', slug: '', expires_at: '', name: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [statsModal, setStatsModal] = useState(null)
  const [statsData, setStatsData] = useState([])
  const [copied, setCopied] = useState('')
  const [qrModal, setQrModal] = useState(null)

  useEffect(() => { fetchLinks() }, [])

  async function fetchLinks() {
    setLoading(true)
    const res = await fetch('/api/links')
    const data = await res.json()
    setLinks(data)
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        original_url: form.original_url,
        slug: form.slug || undefined,
        expires_at: form.expires_at || undefined,
        name: form.name || undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
    } else {
      setForm({ original_url: '', slug: '', expires_at: '', name: '' })
      fetchLinks()
    }
    setSubmitting(false)
  }

  async function handleDelete(id) {
    if (!confirm('이 링크를 삭제할까요?')) return
    await fetch(`/api/links/${id}`, { method: 'DELETE' })
    fetchLinks()
  }

  async function handleToggle(id, current) {
    await fetch(`/api/links/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    fetchLinks()
  }

  async function openStats(link) {
    setStatsModal(link)
    const res = await fetch(`/api/stats/${link.slug}`)
    const data = await res.json()
    setStatsData(data)
  }

  function copyLink(slug) {
    const url = `${window.location.origin}/${slug}`
    navigator.clipboard.writeText(url)
    setCopied(slug)
    setTimeout(() => setCopied(''), 2000)
  }

  function isExpired(link) {
    return link.expires_at && new Date(link.expires_at) < new Date()
  }

  function formatDate(d) {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  function groupByDay(clicks) {
    const map = {}
    clicks.forEach(c => {
      const day = new Date(c.clicked_at).toLocaleDateString('ko-KR')
      map[day] = (map[day] || 0) + 1
    })
    return Object.entries(map).slice(0, 14)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif" }}>
      {/* Header */}
      <header style={{ background: '#111', color: '#fff', padding: '0 32px', display: 'flex', alignItems: 'center', height: '60px', gap: '12px' }}>
        <span style={{ fontSize: '20px' }}>🔗</span>
        <span style={{ fontWeight: '700', fontSize: '18px', letterSpacing: '-0.5px' }}>eeun-link</span>
        <span style={{ color: '#666', fontSize: '13px', marginLeft: '4px' }}>URL 단축 관리</span>
        <button onClick={async () => { await fetch('/api/auth/logout'); window.location.href = '/login' }}
          style={{ marginLeft: 'auto', background: 'none', border: '1px solid #444', color: '#aaa', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
          로그아웃
        </button>
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 16px' }}>
        {/* Form */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: '#111' }}>새 링크 만들기</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={labelStyle}>원본 URL *</label>
                <input
                  style={inputStyle}
                  type="url"
                  placeholder="https://example.com/long-url"
                  value={form.original_url}
                  onChange={e => setForm({ ...form, original_url: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>이름 (선택)</label>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="교보문고 신간, 이벤트 페이지..."
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '10px', alignItems: 'end' }}>
              <div>
                <label style={labelStyle}>슬러그 (선택)</label>
                <input
                  style={{ ...inputStyle, width: '160px' }}
                  type="text"
                  placeholder="my-link"
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle}>만료일 (선택)</label>
                <input
                  style={{ ...inputStyle, width: '160px' }}
                  type="date"
                  value={form.expires_at}
                  onChange={e => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>
            </div>
            {error && <p style={{ color: '#e53e3e', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
            <button type="submit" disabled={submitting} style={btnPrimary}>
              {submitting ? '생성 중...' : '+ 링크 생성'}
            </button>
          </form>
        </div>

        {/* Links Table */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111' }}>링크 목록</h2>
            <span style={{ fontSize: '13px', color: '#999' }}>총 {links.length}개</span>
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>불러오는 중...</div>
          ) : links.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>아직 링크가 없습니다</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  {['이름', '단축 URL', '원본 URL', '클릭', '만료일', '상태', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', color: '#999', fontWeight: '600', borderBottom: '1px solid #f0f0f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {links.map(link => {
                  const expired = isExpired(link)
                  const clickCount = link.clicks?.[0]?.count ?? 0
                  const shortUrl = `${BASE_URL}/${link.slug}`
                  return (
                    <tr key={link.id} style={{ borderBottom: '1px solid #f7f7f7' }}>
                      <td style={{ padding: '12px 16px', maxWidth: '140px' }}>
                        <span style={{ fontSize: '13px', color: '#333', fontWeight: link.name ? '600' : '400' }}>
                          {link.name || <span style={{ color: '#ccc' }}>-</span>}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#111', fontFamily: 'monospace' }}>/{link.slug}</span>
                          <button onClick={() => copyLink(link.slug)} style={btnIcon} title="복사">
                            {copied === link.slug ? '✓' : '⧉'}
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', maxWidth: '240px' }}>
                        <a href={link.original_url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: '12px', color: '#555', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {link.original_url}
                        </a>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => openStats(link)} style={{ ...btnIcon, fontSize: '13px', fontWeight: '700', color: '#4a90d9' }}>
                          {clickCount}회
                        </button>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: expired ? '#e53e3e' : '#555' }}>
                        {expired ? `만료 (${formatDate(link.expires_at)})` : formatDate(link.expires_at)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => handleToggle(link.id, link.is_active)} style={{
                          fontSize: '11px', padding: '3px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                          background: link.is_active && !expired ? '#e6f4ea' : '#f5f5f5',
                          color: link.is_active && !expired ? '#2d7d46' : '#999',
                          fontWeight: '600'
                        }}>
                          {link.is_active && !expired ? '활성' : '비활성'}
                        </button>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => setQrModal(link)} style={{ ...btnIcon, fontSize: '15px' }} title="QR 코드">⊞</button>
                          <button onClick={() => handleDelete(link.id)} style={{ ...btnIcon, color: '#e53e3e' }} title="삭제">✕</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* QR Modal */}
      {qrModal && (
        <div onClick={() => setQrModal(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: '16px', padding: '32px', textAlign: 'center', maxWidth: '320px', width: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111' }}>QR 코드</h3>
                <p style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>{qrModal.name || `/${qrModal.slug}`}</p>
              </div>
              <button onClick={() => setQrModal(null)} style={{ ...btnIcon, fontSize: '18px', color: '#999' }}>✕</button>
            </div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/${qrModal.slug}`)}`}
              alt="QR Code"
              style={{ width: '200px', height: '200px', borderRadius: '8px' }}
            />
            <p style={{ fontSize: '12px', color: '#999', marginTop: '12px', wordBreak: 'break-all' }}>
              {window.location.origin}/{qrModal.slug}
            </p>
            <a
              href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`${window.location.origin}/${qrModal.slug}`)}`}
              download={`qr-${qrModal.slug}.png`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block', marginTop: '16px', padding: '10px 24px',
                background: '#111', color: '#fff', borderRadius: '8px',
                textDecoration: 'none', fontSize: '13px', fontWeight: '600'
              }}
            >
              이미지 다운로드
            </a>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {statsModal && (
        <div onClick={() => setStatsModal(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px',
            maxHeight: '80vh', overflow: 'auto', padding: '28px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111' }}>클릭 통계</h3>
                <p style={{ fontSize: '13px', color: '#999', marginTop: '2px' }}>/{statsModal.slug}</p>
              </div>
              <button onClick={() => setStatsModal(null)} style={{ ...btnIcon, fontSize: '18px', color: '#999' }}>✕</button>
            </div>

            <div style={{ background: '#f5f5f5', borderRadius: '10px', padding: '16px', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', fontWeight: '800', color: '#111' }}>{statsData.length}</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>총 클릭 수</div>
            </div>

            {statsData.length > 0 && (
              <>
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '12px' }}>일별 클릭</h4>
                {groupByDay(statsData).map(([day, count]) => (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#555', width: '90px', flexShrink: 0 }}>{day}</span>
                    <div style={{ flex: 1, background: '#f0f0f0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#111', borderRadius: '4px', width: `${(count / Math.max(...groupByDay(statsData).map(([, c]) => c))) * 100}%` }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#111', width: '30px', textAlign: 'right' }}>{count}</span>
                  </div>
                ))}

                <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#666', margin: '20px 0 12px' }}>최근 클릭</h4>
                {statsData.slice(0, 20).map((c, i) => (
                  <div key={i} style={{ fontSize: '12px', color: '#555', padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                    {new Date(c.clicked_at).toLocaleString('ko-KR')}
                  </div>
                ))}
              </>
            )}

            {statsData.length === 0 && (
              <p style={{ textAlign: 'center', color: '#999', fontSize: '14px', padding: '24px 0' }}>아직 클릭 데이터가 없습니다</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }
const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: '8px',
  fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: '#111'
}
const btnPrimary = {
  marginTop: '14px', padding: '11px 24px', background: '#111', color: '#fff',
  border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
  cursor: 'pointer'
}
const btnIcon = {
  background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
  borderRadius: '4px', fontSize: '14px'
}
