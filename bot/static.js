import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'webapp', 'dist')

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
}

export function serveStatic(req, res, url) {
  if (!fs.existsSync(distDir)) return false
  let reqPath = decodeURIComponent(url.pathname)
  if (reqPath === '/') reqPath = '/index.html'
  const filePath = path.normalize(path.join(distDir, reqPath))
  if (!filePath.startsWith(distDir)) return false
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath)
    const body = fs.readFileSync(filePath)
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' })
    res.end(body)
    return true
  }
  const index = path.join(distDir, 'index.html')
  if (fs.existsSync(index)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(fs.readFileSync(index))
    return true
  }
  return false
}
