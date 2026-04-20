import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('links')
      .select('*, clicks(count)')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { original_url, slug, expires_at } = req.body

    if (!original_url) return res.status(400).json({ error: 'URL이 필요합니다' })

    const finalSlug = slug || Math.random().toString(36).substring(2, 8)

    const { data, error } = await supabase
      .from('links')
      .insert({ original_url, slug: finalSlug, expires_at: expires_at || null })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: '이미 사용 중인 슬러그입니다' })
      return res.status(500).json({ error: error.message })
    }
    return res.status(201).json(data)
  }

  res.status(405).json({ error: 'Method not allowed' })
}
