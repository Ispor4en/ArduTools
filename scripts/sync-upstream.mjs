// Fetch the WebTools submodule pin and the runtime files those pages load.
// Nested upstream submodules such as the full Plotly and ArduPilot trees are
// not cloned. Only the files the browser requests are stored under vendor/.
// Copyright (C) 2026 UnknownTeam
// SPDX-License-Identifier: GPL-3.0-only

import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdtemp, mkdir, readFile, rm, stat, writeFile, cp } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { safeJoin } = require('../shared/safe-path.js')

const root = path.resolve(import.meta.dirname, '..')
const webtools = path.join(root, 'upstream', 'WebTools')
const runtimeRoot = path.join(root, 'vendor', 'runtime')
const cdnRoot = path.join(root, 'vendor', 'cdn')
const force = process.argv.includes('--force')

const CDN = [
  ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', true],
  ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', false],
  ['https://unpkg.com/leaflet-editable@1.2.0/src/Leaflet.Editable.js', false],
  ['https://unpkg.com/@bagage/leaflet.restoreview@1.0.1/leaflet.restoreview.js', false],
  ['https://unpkg.com/@turf/turf@6/turf.min.js', false],
  ['https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css', true],
  ['https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js', false],
  ['https://unpkg.com/leaflet.gridlayer.googlemutant@0.16.0/dist/Leaflet.GoogleMutant.js', false],
  ['https://unpkg.com/leaflet-rotatedmarker@0.2.0/leaflet.rotatedMarker.js', false],
  ['https://unpkg.com/mediabunny@1.40.1/dist/bundles/mediabunny.min.cjs', false],
  ['https://unpkg.com/gridstack@10.3.1/dist/gridstack-all.js', false],
  ['https://unpkg.com/gridstack@10.3.1/dist/gridstack.min.css', true],
  ['https://unpkg.com/gridstack@10.3.1/dist/gridstack-extra.min.css', true],
  ['https://cdn.form.io/formiojs/formio.full.min.css', true],
  ['https://unpkg.com/formiojs/dist/formio.full.min.js', false],
  ['https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css', true],
  ['https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css', true],
  ['https://cdn.jsdelivr.net/npm/hls.js@1.7.3/dist/hls.min.js', false],
  ['https://cdn.plot.ly/plotly-2.35.0.min.js', false],
  ['https://cdn.jsdelivr.net/npm/marked@4.3.0/marked.min.js', false],
  ['https://cdn.jsdelivr.net/npm/dompurify@3.0.5/dist/purify.min.js', false],
  ['https://cdn.jsdelivr.net/npm/openai@4.85.4/+esm', true],
  ['https://esm.sh/@octokit/request', true],
  ['https://unpkg.com/flight-indicators-js@1.0.5/css/flight-indicators.css', true],
  ['https://unpkg.com/flight-indicators-js@1.0.5/esm/module-flight-indicators.mjs', true],
  ['https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js', true],
  ['https://unpkg.com/osmtogeojson@3.0.0-beta.5/osmtogeojson.js', false],
]

function gitlink(spec) {
  const line = execFileSync('git', ['-C', webtools, 'ls-tree', 'HEAD', spec], { encoding: 'utf8' }).trim()
  const sha = line.split(/\s+/)[2]
  if (!/^[0-9a-f]{40}$/.test(sha || '')) throw new Error(`No gitlink for ${spec}: ${line}`)
  return sha
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchBuffer(url) {
  let last
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: { 'user-agent': 'ArduTools-sync' },
      })
      if (response.status === 429 || response.status >= 500) {
        await sleep(700 * attempt)
        continue
      }
      if (!response.ok) throw new Error(`${response.status} ${url}`)
      return {
        buffer: Buffer.from(await response.arrayBuffer()),
        finalUrl: response.url,
        type: response.headers.get('content-type') || '',
      }
    } catch (error) {
      last = error
      await sleep(700 * attempt)
    }
  }
  throw last
}

function looksLikeHtml(buffer) {
  const head = buffer.subarray(0, 80).toString('utf8').trim().toLowerCase()
  return head.startsWith('<!doctype') || head.startsWith('<html')
}

async function writeExact(file, buffer) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, buffer)
}

function mirrorFile(url) {
  const parsed = new URL(url)
  const parts = decodeURIComponent(parsed.pathname).split('/').filter(Boolean)
  return safeJoin(cdnRoot, parsed.hostname, ...parts)
}

async function mapPool(items, limit, fn) {
  let index = 0
  async function worker() {
    while (index < items.length) {
      const current = index
      index += 1
      await fn(items[current])
    }
  }
  const width = Math.min(limit, items.length)
  if (width > 0) await Promise.all(Array.from({ length: width }, () => worker()))
}

function cssRefs(text, base) {
  const refs = []
  const pattern = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g
  let match = pattern.exec(text)
  while (match) {
    const ref = match[2].trim()
    if (ref && !ref.startsWith('data:')) {
      try {
        const resolved = new URL(ref, base)
        if (resolved.protocol === 'https:') refs.push(resolved.href)
      } catch {
        // Ignore unparsable CSS urls.
      }
    }
    match = pattern.exec(text)
  }
  return refs
}

function moduleRefs(text, base) {
  const refs = []
  const pattern = /\bfrom\s*['"]([^'"\s]+)['"]|\bimport\s*['"]([^'"\s]+)['"]|\bimport\s*\(\s*['"]([^'"\s]+)['"]\s*\)/g
  let match = pattern.exec(text)
  while (match) {
    const spec = match[1] || match[2] || match[3]
    if (spec && !spec.startsWith('data:') && !spec.startsWith('node:')) {
      try {
        const resolved = new URL(spec, base)
        if (resolved.protocol === 'https:') refs.push(resolved.href)
      } catch {
        // Relative specifiers that fail to resolve are skipped.
      }
    }
    match = pattern.exec(text)
  }
  return refs
}

async function mirrorUrl(url, crawlJs) {
  const dest = mirrorFile(url)
  if (!dest) throw new Error(`Unsafe mirror path for ${url}`)
  if (!force && existsSync(dest)) {
    const info = await stat(dest)
    if (info.size > 0) {
      if (url.split('?')[0].endsWith('.css')) {
        const text = await readFile(dest, 'utf8')
        return cssRefs(text, url).map((item) => ({ url: item, crawl: false }))
      }
      return []
    }
  }
  const { buffer, type } = await fetchBuffer(url)
  const script = /\.(m?js|cjs)$/.test(new URL(url).pathname) || url.includes('+esm')
  if ((script || url.endsWith('.css')) && looksLikeHtml(buffer)) {
    throw new Error(`HTML body for ${url}`)
  }
  await writeExact(dest, buffer)
  console.log(`cdn ${buffer.length}\t${url}`)
  const text = buffer.toString('utf8')
  const found = []
  if (type.includes('css') || url.split('?')[0].endsWith('.css')) {
    found.push(...cssRefs(text, url).map((item) => ({ url: item, crawl: false })))
  }
  if (crawlJs) found.push(...moduleRefs(text, url).map((item) => ({ url: item, crawl: true })))
  return found
}

async function mirrorCdn() {
  const seen = new Set()
  let wave = CDN.map(([url, crawl]) => ({ url, crawl }))
  for (let depth = 0; depth < 4 && wave.length; depth += 1) {
    const next = []
    await mapPool(wave, 4, async (item) => {
      if (seen.has(item.url)) return
      seen.add(item.url)
      if (seen.size > 400) return
      try {
        const discovered = await mirrorUrl(item.url, item.crawl && depth < 3)
        next.push(...discovered)
      } catch (error) {
        if (item.crawl && depth > 0) {
          console.warn(`skip ${item.url}: ${error.message}`)
          return
        }
        throw error
      }
    })
    wave = next
  }
}

async function downloadFirst(urls) {
  let last
  for (const url of urls) {
    try {
      const result = await fetchBuffer(url)
      if (looksLikeHtml(result.buffer)) throw new Error(`HTML body for ${url}`)
      return result.buffer
    } catch (error) {
      last = error
      console.warn(`try ${url}: ${error.message}`)
    }
  }
  throw last
}

async function vendorRaw(urls, parts, minimum) {
  const dest = safeJoin(runtimeRoot, ...parts)
  if (!dest) throw new Error(`Unsafe runtime path ${parts.join('/')}`)
  if (!force && existsSync(dest) && (await stat(dest)).size >= minimum) {
    console.log(`keep ${parts.join('/')}`)
    return
  }
  const buffer = await downloadFirst(urls)
  if (buffer.length < minimum) throw new Error(`${parts.join('/')} is only ${buffer.length} bytes`)
  await writeExact(dest, buffer)
  console.log(`runtime ${buffer.length}\t${parts.join('/')}`)
}

async function extractArchive(url, flags) {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'ardutools-'))
  const archive = path.join(tmp, 'archive.bin')
  const { buffer } = await fetchBuffer(url)
  await writeExact(archive, buffer)
  execFileSync('tar', [...flags, archive, '-C', tmp], { stdio: 'inherit' })
  return tmp
}

async function vendorParser(sha) {
  const dest = safeJoin(runtimeRoot, 'modules', 'JsDataflashParser')
  const parser = path.join(dest, 'parser.js')
  if (!force && existsSync(parser)) {
    const text = await readFile(parser, 'utf8')
    if (text.includes('export default')) {
      console.log('keep JsDataflashParser')
      return
    }
  }
  const tmp = await extractArchive(`https://github.com/Williangalvani/JsDataflashParser/archive/${sha}.tar.gz`, ['-xzf'])
  let extracted = path.join(tmp, `JsDataflashParser-${sha}`)
  if (!existsSync(path.join(extracted, 'parser.js'))) {
    const { readdirSync } = await import('node:fs')
    const nested = readdirSync(tmp).find((name) => name !== 'archive.bin')
    extracted = path.join(tmp, nested)
  }
  await rm(dest, { recursive: true, force: true })
  await cp(extracted, dest, { recursive: true })
  await rm(tmp, { recursive: true, force: true })
  const text = await readFile(path.join(dest, 'parser.js'), 'utf8')
  if (!text.includes('export default')) throw new Error('JsDataflashParser parser.js has no default export')
  console.log('runtime JsDataflashParser')
}

async function vendorPyodide() {
  const dest = safeJoin(cdnRoot, 'cdn.jsdelivr.net', 'pyodide', 'v0.26.1', 'full')
  const marker = path.join(dest, 'pyodide.js')
  if (!force && existsSync(marker) && existsSync(path.join(dest, 'pyodide.asm.wasm'))) {
    console.log('keep pyodide core')
    return
  }
  await mkdir(dest, { recursive: true })
  try {
    const tmp = await extractArchive('https://github.com/pyodide/pyodide/releases/download/0.26.1/pyodide-core-0.26.1.tar.bz2', ['-xjf'])
    const nested = await findFile(tmp, 'pyodide.js')
    if (!nested) throw new Error('pyodide.js missing from core tarball')
    await cp(path.dirname(nested), dest, { recursive: true })
    await rm(tmp, { recursive: true, force: true })
  } catch (error) {
    console.warn(`pyodide tarball failed (${error.message}); downloading core files`)
    const base = 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/'
    for (const name of ['pyodide.js', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']) {
      const { buffer } = await fetchBuffer(base + name)
      await writeExact(path.join(dest, name), buffer)
    }
  }
  console.log('cdn pyodide core')
}

async function findFile(dir, name) {
  const { readdir } = await import('node:fs/promises')
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isFile() && entry.name === name) return full
    if (entry.isDirectory()) {
      const found = await findFile(full, name)
      if (found) return found
    }
  }
  return null
}

async function vendorMonaco() {
  const latest = safeJoin(cdnRoot, 'unpkg.com', 'monaco-editor@latest', 'min', 'vs', 'loader.js')
  if (!force && existsSync(latest)) {
    console.log('keep monaco-editor')
    return
  }
  const meta = await (await fetch('https://registry.npmjs.org/monaco-editor/latest')).json()
  const tmp = await extractArchive(meta.dist.tarball, ['-xzf'])
  const min = path.join(tmp, 'package', 'min')
  await cp(min, safeJoin(cdnRoot, 'unpkg.com', 'monaco-editor@latest', 'min'), { recursive: true })
  await cp(min, safeJoin(cdnRoot, 'unpkg.com', `monaco-editor@${meta.version}`, 'min'), { recursive: true })
  await rm(tmp, { recursive: true, force: true })
  console.log(`cdn monaco-editor@${meta.version}`)
}

async function main() {
  if (!existsSync(path.join(webtools, 'index.html'))) {
    execFileSync('git', ['submodule', 'update', '--init', 'upstream/WebTools'], { cwd: root, stdio: 'inherit' })
  }
  const head = execFileSync('git', ['-C', webtools, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  const plotly = gitlink('modules/plotly.js')
  const fft = gitlink('modules/fft.js')
  const tabulator = gitlink('modules/tabulator')
  const parser = gitlink('modules/JsDataflashParser')

  await vendorRaw([
    `https://raw.githubusercontent.com/plotly/plotly.js/${plotly}/dist/plotly.min.js`,
  ], ['modules', 'plotly.js', 'dist', 'plotly.min.js'], 500_000)

  await vendorRaw([
    `https://raw.githubusercontent.com/indutny/fft.js/${fft}/dist/fft.js`,
    `https://raw.githubusercontent.com/indutny/fft.js/${fft}/lib/fft.js`,
    'https://cdn.jsdelivr.net/npm/fft.js@0.3.0/dist/fft.js',
  ], ['modules', 'fft.js', 'dist', 'fft.js'], 200)

  await vendorRaw([
    `https://raw.githubusercontent.com/olifolkerd/tabulator/${tabulator}/dist/js/tabulator.min.js`,
    `https://raw.githubusercontent.com/tabulator-tables/tabulator/${tabulator}/dist/js/tabulator.min.js`,
  ], ['modules', 'tabulator', 'dist', 'js', 'tabulator.min.js'], 10_000)

  await vendorRaw([
    `https://raw.githubusercontent.com/olifolkerd/tabulator/${tabulator}/dist/css/tabulator.min.css`,
    `https://raw.githubusercontent.com/tabulator-tables/tabulator/${tabulator}/dist/css/tabulator.min.css`,
  ], ['modules', 'tabulator', 'dist', 'css', 'tabulator.min.css'], 1000)

  await vendorParser(parser)
  await mirrorCdn()
  await vendorPyodide()
  await vendorMonaco()

  const source = {
    webtools: head,
    plotly,
    fft,
    tabulator,
    parser,
    syncedAt: new Date().toISOString(),
  }
  await writeExact(path.join(runtimeRoot, 'SOURCE.json'), Buffer.from(`${JSON.stringify(source, null, 2)}\n`))
  console.log(`synced WebTools ${head}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
