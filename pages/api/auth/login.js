import { serialize } from 'cookie'

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { password } = req.body
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword || password !== adminPassword) {
    return res.status(401).json({ error: '비밀번호가 틀렸습니다' })
  }

  const cookie = serialize('auth', 'ok', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  res.setHeader('Set-Cookie', cookie)
  res.status(200).json({ ok: true })
}
