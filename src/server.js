// ArduTools — desktop shell for ArduPilot WebTools.
// Copyright (C) 2026 UnknownTeam
// SPDX-License-Identifier: GPL-3.0-only

const http = require('http')
const fs = require('fs')
const path = require('path')
const { safeJoin } = require('../shared/safe-path')
const { contentType } = require('../shared/mime')

const DIALOG_STUB = '<script>window.alert=function(){};window.confirm=function(){return true};window.prompt=function(){return null};</script>'

function startServer(options) {
  const server = http.createServer((req, res) => {
    handle(req, res, options).catch((error) => {
      console.error(error)
      if (!res.headersSent) {
        res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
      }
      res.end('Internal error')
    })
  })

  const port = options.port || 0
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () => {
      const address = server.address()
      resolve({
        server,
        port: address.port,
        origin: `http://127.0.0.1:${address.port}`,
        close() {
          return new Promise((done, fail) => {
            server.close((error) => (error ? fail(error) : done()))
          })
        },
      })
    })
  })
}

async function handle(req, res, options) {
  const method = req.method || 'GET'
  if (method !== 'GET' && method !== 'HEAD') {
    send(res, 405, 'text/plain; charset=utf-8', 'Method not allowed', method === 'HEAD')
    return
  }

  const url = new URL(req.url || '/', 'http://127.0.0.1')
  const pathname = decodeURIComponent(url.pathname)
  if (pathname.includes('\0')) {
    send(res, 400, 'text/plain; charset=utf-8', 'Bad path', method === 'HEAD')
    return
  }

  if (pathname === '/__shell/meta.json') {
    const body = JSON.stringify({
      version: options.version || '',
      upstream: options.upstreamCommit || '',
    })
    send(res, 200, 'application/json; charset=utf-8', body, method === 'HEAD')
    return
  }

  if (pathname === '/__shell/NOTICE' && options.noticePath) {
    await sendFile(res, options.noticePath, method === 'HEAD', false, path.dirname(options.noticePath))
    return
  }

  const mounted = mount(pathname, options)
  if (mounted) {
    await sendResolved(res, mounted.root, mounted.rel, method === 'HEAD', false)
    return
  }

  if (pathname === '/' || pathname === '/index.html') {
    await sendResolved(res, options.shellDir, 'index.html', method === 'HEAD', Boolean(options.neutralizeDialogs))
    return
  }

  const rel = pathname.replace(/^\/+/, '')
  if (rel === 'SimpleGCS/config.js') {
    const configured = safeJoin(options.webtoolsDir, 'SimpleGCS', 'config.js')
    const example = safeJoin(options.webtoolsDir, 'SimpleGCS', 'config.example.js')
    const chosen = configured && isFile(configured) ? configured : example
    if (chosen && isFile(chosen)) {
      await sendFile(res, chosen, method === 'HEAD', false, options.webtoolsDir)
      return
    }
  }
  const vendorHit = options.vendorRuntimeDir ? safeJoin(options.vendorRuntimeDir, rel) : null
  if (vendorHit && isFile(vendorHit)) {
    await sendFile(res, vendorHit, method === 'HEAD', false, options.vendorRuntimeDir)
    return
  }

  await sendResolved(res, options.webtoolsDir, rel, method === 'HEAD', Boolean(options.neutralizeDialogs))
}

function mount(pathname, options) {
  if (pathname === '/__shell' || pathname.startsWith('/__shell/')) {
    return { root: options.shellDir, rel: pathname.replace(/^\/__shell\/?/, '') || 'index.html' }
  }
  if (pathname === '/__shared' || pathname.startsWith('/__shared/')) {
    return { root: options.sharedDir, rel: pathname.replace(/^\/__shared\/?/, '') }
  }
  return null
}

async function sendResolved(res, root, rel, head, neutralize) {
  if (!rel) {
    send(res, 404, 'text/plain; charset=utf-8', 'Not found', head)
    return
  }
  const full = safeJoin(root, rel)
  if (!full) {
    send(res, 400, 'text/plain; charset=utf-8', 'Bad path', head)
    return
  }

  let stat
  try {
    stat = await fs.promises.stat(full)
  } catch {
    send(res, 404, 'text/plain; charset=utf-8', 'Not found', head)
    return
  }

  if (stat.isDirectory()) {
    const urlPath = rel ? `/${rel.replace(/\\/g, '/')}` : '/'
    if (!urlPath.endsWith('/')) {
      res.writeHead(302, { location: `${urlPath}/` })
      res.end()
      return
    }
    const index = safeJoin(full, 'index.html')
    if (!index || !isFile(index)) {
      send(res, 404, 'text/plain; charset=utf-8', 'Not found', head)
      return
    }
    await sendFile(res, index, head, neutralize, root)
    return
  }

  if (!stat.isFile()) {
    send(res, 404, 'text/plain; charset=utf-8', 'Not found', head)
    return
  }
  await sendFile(res, full, head, neutralize, root)
}

async function sendFile(res, file, head, neutralize, root) {
  let real
  try {
    real = await fs.promises.realpath(file)
  } catch {
    send(res, 404, 'text/plain; charset=utf-8', 'Not found', head)
    return
  }
  const base = path.resolve(root)
  const relative = path.relative(base, real)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    send(res, 404, 'text/plain; charset=utf-8', 'Not found', head)
    return
  }
  const data = await fs.promises.readFile(real)
  const type = contentType(real)
  let body = data
  if (neutralize && type.startsWith('text/html')) {
    const html = data.toString('utf8')
    if (/<head[^>]*>/i.test(html)) {
      body = Buffer.from(html.replace(/<head[^>]*>/i, (match) => match + DIALOG_STUB), 'utf8')
    } else {
      body = Buffer.from(DIALOG_STUB + html, 'utf8')
    }
  }
  send(res, 200, type, body, head)
}

function send(res, status, type, body, head) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(String(body))
  res.writeHead(status, {
    'content-type': type,
    'content-length': String(payload.length),
    'cache-control': 'no-cache',
    'x-content-type-options': 'nosniff',
  })
  if (head) res.end()
  else res.end(payload)
}

function isFile(file) {
  try {
    return fs.statSync(file).isFile()
  } catch {
    return false
  }
}

module.exports = { startServer }
