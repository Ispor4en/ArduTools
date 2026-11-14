// Light Ukrainian labels for MAGFit, Filter Review, PID Review, and Hardware Report.
// Upstream HTML is not modified on disk. Exact English labels are swapped in the live page.
// Copyright (C) 2026 UnknownTeam
// SPDX-License-Identifier: GPL-3.0-only

(function () {
  if (window.__ardutoolsToolI18n) return
  window.__ardutoolsToolI18n = true

  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE', 'SVG'])
  const originals = new WeakMap()
  let phrases = {}
  let lang = 'en'

  function cookieLang() {
    const match = document.cookie.match(/(?:^|; )ardutools_lang=(uk|en)/)
    return match ? match[1] : 'en'
  }

  function remember(node, key, value) {
    let bag = originals.get(node)
    if (!bag) {
      bag = {}
      originals.set(node, bag)
    }
    if (!(key in bag)) bag[key] = value
    return bag[key]
  }

  function translated(source) {
    const trimmed = String(source || '').trim()
    if (lang !== 'uk' || !Object.prototype.hasOwnProperty.call(phrases, trimmed)) return source
    const leading = String(source).match(/^\s*/)[0]
    const trailing = String(source).match(/\s*$/)[0]
    return leading + phrases[trimmed] + trailing
  }

  function applyText(node) {
    const original = remember(node, 'text', node.nodeValue)
    const next = translated(original)
    if (node.nodeValue !== next) node.nodeValue = next
  }

  function applyAttr(element, name) {
    if (!element.hasAttribute(name)) return
    const original = remember(element, name, element.getAttribute(name))
    const next = translated(original)
    if (name === 'value') element.value = next
    if (element.getAttribute(name) !== next) element.setAttribute(name, next)
  }

  function applyControl(element) {
    if (element.tagName === 'INPUT') {
      const type = (element.getAttribute('type') || '').toLowerCase()
      if (type === 'button' || type === 'submit') applyAttr(element, 'value')
    }
    if (element.tagName === 'BUTTON' && element.childNodes.length === 1 && element.firstChild.nodeType === Node.TEXT_NODE) {
      applyText(element.firstChild)
    }
    applyAttr(element, 'title')
  }

  function walk(node) {
    if (!node) return
    if (node.nodeType === Node.TEXT_NODE) {
      applyText(node)
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    if (SKIP.has(node.tagName)) return
    if (node.classList && (node.classList.contains('plotly') || node.classList.contains('js-plotly-plot'))) return
    applyControl(node)
    for (const child of [...node.childNodes]) walk(child)
  }

  function applyTitle() {
    const original = remember(document, 'title', document.title)
    const next = translated(original)
    if (document.title !== next) document.title = next
  }

  function apply() {
    lang = cookieLang()
    document.documentElement.lang = lang === 'uk' ? 'uk' : 'en'
    if (document.body) walk(document.body)
    applyTitle()
  }

  function boot(map) {
    phrases = map || {}
    const start = () => {
      apply()
      if (!document.body) return
      const observer = new MutationObserver(() => apply())
      observer.observe(document.body, { childList: true, subtree: true })
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true })
    else start()
    window.addEventListener('message', (event) => {
      if (event.origin !== location.origin) return
      if (!event.data || event.data.type !== 'ardutools-lang') return
      document.cookie = `ardutools_lang=${event.data.lang === 'uk' ? 'uk' : 'en'}; Path=/; Max-Age=31536000; SameSite=Lax`
      if (document.body) apply()
    })
  }

  fetch('/__shell/tool-phrases.json')
    .then((response) => response.json())
    .then(boot)
    .catch(() => {})
})()
