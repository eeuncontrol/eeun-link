import { parse } from 'cookie'

export function isAuthenticated(req) {
  const cookies = parse(req.headers.cookie || '')
  return cookies.auth === 'ok'
}
