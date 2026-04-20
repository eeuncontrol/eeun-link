import { supabase } from '../lib/supabase'

export async function getServerSideProps({ params, req }) {
  const { slug } = params

  const { data: link } = await supabase
    .from('links')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!link) {
    return { props: { notFound: true, slug } }
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { props: { expired: true, slug } }
  }

  await supabase.from('clicks').insert({
    link_id: link.id,
    ip_address: (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null,
    user_agent: req.headers['user-agent'] || null,
  })

  return {
    redirect: { destination: link.original_url, permanent: false },
  }
}

export default function RedirectPage({ expired, notFound, slug }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
      background: '#f8f8f8'
    }}>
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>{expired ? '⏰' : '🔗'}</div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111', marginBottom: '8px' }}>
          {expired ? '링크가 만료되었습니다' : '링크를 찾을 수 없습니다'}
        </h1>
        <p style={{ color: '#666', marginBottom: '32px' }}>
          {expired
            ? `/${slug} 링크의 유효 기간이 지났습니다.`
            : `/${slug} 링크가 존재하지 않거나 비활성화되었습니다.`}
        </p>
        <a href="/" style={{
          display: 'inline-block', padding: '12px 28px',
          background: '#111', color: '#fff', borderRadius: '8px',
          textDecoration: 'none', fontWeight: '600'
        }}>
          홈으로 돌아가기
        </a>
      </div>
    </div>
  )
}
