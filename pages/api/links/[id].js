import { supabase } from '../../../lib/supabase'
import { isAuthenticated } from '../../../lib/auth'

export default async function handler(req, res) {
  if (!isAuthenticated(req)) return res.status(401).json({ error: '인증이 필요합니다' })

  const { id } = req.query

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('links').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  if (req.method === 'PATCH') {
    const { is_active, original_url, name, expires_at } = req.body
    const updateData = {}
    if (is_active !== undefined) updateData.is_active = is_active
    if (original_url !== undefined) updateData.original_url = original_url
    if (name !== undefined) updateData.name = name
    if (expires_at !== undefined) updateData.expires_at = expires_at || null

    const { data, error } = await supabase
      .from('links')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  res.status(405).json({ error: 'Method not allowed' })
}
