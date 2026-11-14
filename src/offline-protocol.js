// ArduTools — desktop shell for ArduPilot WebTools.
// Copyright (C) 2026 UnknownTeam
// SPDX-License-Identifier: GPL-3.0-only

const fs = require('fs')
const { net } = require('electron')
const { safeJoin } = require('../shared/safe-path')
const { contentType } = require('../shared/mime')

const MIRROR_HOSTS = new Set([
  'unpkg.com',
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'cdn.form.io',
  'cdn.plot.ly',
  'esm.sh',
])

function localPathForHttpsUrl(cdnRoot, rawUrl) {
  let url
  try {
    url = new URL(rawUrl)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || !MIRROR_HOSTS.has(url.hostname)) return null
  const parts = decodeURIComponent(url.pathname).split('/').filter(Boolean)
  if (!parts.length) return null
  return safeJoin(cdnRoot, url.hostname, ...parts)
}

function sniffType(file, data) {
  const known = contentType(file)
  if (known !== 'application/octet-stream' || !data) return known
  const head = data.subarray(0, 180).toString('utf8').trimStart()
  if (
    head.startsWith('import')
    || head.startsWith('export')
    || head.startsWith('//')
    || head.startsWith('/*')
    || head.startsWith('!function')
    || head.startsWith('(function')
    || head.startsWith('var ')
    || head.startsWith('const ')
    || head.startsWith('class ')
  ) {
    return 'text/javascript; charset=utf-8'
  }
  return known
}

function installOfflineMirror(ses, cdnRoot) {
  ses.protocol.handle('https', async (request) => {
    const mirrored = localPathForHttpsUrl(cdnRoot, request.url)
    if (mirrored && (request.method === 'GET' || request.method === 'HEAD')) {
      try {
        const stat = await fs.promises.stat(mirrored)
        if (stat.isFile()) {
          const headers = {
            'content-type': contentType(mirrored),
            'content-length': String(stat.size),
            'access-control-allow-origin': '*',
            'cache-control': 'public, max-age=86400',
          }
          const data = request.method === 'HEAD' ? null : await fs.promises.readFile(mirrored)
          headers['content-type'] = sniffType(mirrored, data)
          if (request.method === 'HEAD') return new Response(null, { status: 200, headers })
          return new Response(data, { status: 200, headers })
        }
      } catch {
        // Missing vendor file. Offline mode must not silently use the network.
      }
    }
    if (process.env.ARDUTOOLS_OFFLINE === '1') {
      try {
        const host = new URL(request.url).hostname
        if (MIRROR_HOSTS.has(host)) return new Response('Not vendored', { status: 404 })
      } catch {
        return new Response('Bad URL', { status: 400 })
      }
    }
    return net.fetch(request, { bypassCustomProtocolHandlers: true })
  })
}

module.exports = { installOfflineMirror, localPathForHttpsUrl, MIRROR_HOSTS }
