// ArduTools — injected into an upstream tool page so a dropped file can
// reach that page's own <input type="file">. The upstream sources are not modified.
// Copyright (C) 2026 UnknownTeam
// SPDX-License-Identifier: GPL-3.0-only

(function () {
  if (window.__ardutoolsBridge) return
  window.__ardutoolsBridge = true

  const VIDEO = new Set(['.mp4', '.mov', '.webm', '.mkv', '.avi', '.m4v'])

  function extensionOf(name) {
    const base = String(name || '').split(/[/\\]/).pop()
    const dot = base.lastIndexOf('.')
    if (dot <= 0) return ''
    return base.slice(dot).toLowerCase()
  }

  function pickInput(doc, filename) {
    const ext = extensionOf(filename)
    const inputs = [...doc.querySelectorAll('input[type="file"]')].filter((input) => !input.disabled)
    let best = null
    let bestScore = -1
    for (const input of inputs) {
      const accept = (input.getAttribute('accept') || '').toLowerCase()
      let score = -1
      if (!accept) score = 1
      else if (ext && accept.includes(ext)) score = 5
      else if (VIDEO.has(ext) && accept.includes('video')) score = 5
      if (score > bestScore) {
        best = input
        bestScore = score
      }
    }
    return bestScore >= 0 ? best : null
  }

  function inject(file) {
    const input = pickInput(document, file.name)
    if (!input) return { ok: false, reason: 'no-input' }
    const transfer = new DataTransfer()
    transfer.items.add(file)
    input.files = transfer.files
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    return { ok: true, reason: '' }
  }

  window.addEventListener('message', (event) => {
    if (event.origin !== location.origin) return
    const data = event.data
    if (!data || data.type !== 'ardutools-inject' || !data.name) return
    const file = new File([data.buffer], data.name)
    const result = inject(file)
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'ardutools-inject-result',
        token: data.token,
        name: data.name,
        ok: result.ok,
        reason: result.reason,
      }, location.origin)
    }
  })

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest && event.target.closest('a[href]')
    if (!anchor) return
    let url
    try {
      url = new URL(anchor.href, location.href)
    } catch {
      return
    }
    if (url.origin === location.origin) return
    event.preventDefault()
    event.stopPropagation()
    if (window.ardutools && window.ardutools.openExternal) {
      window.ardutools.openExternal(url.href)
      return
    }
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'ardutools-external', url: url.href }, location.origin)
    }
  }, true)

  if (window.parent === window) {
    window.addEventListener('dragover', (event) => {
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
      event.preventDefault()
    })
    window.addEventListener('drop', (event) => {
      event.preventDefault()
      const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]
      if (file) inject(file)
    })
  }
})()
