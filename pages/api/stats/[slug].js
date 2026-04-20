import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  const { slug } = req.query

  const { data: link } = await supabase
    .from('links')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!link) return res.status(404).json({ error: '링크를 찾을 수 없습니다' })

  const { data: clicks, error } = await supabase
    .from('clicks')
    .select('clicked_at, ip_address, user_agent')
    .eq('link_id', link.id)
    .order('clicked_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json(clicks)
}
