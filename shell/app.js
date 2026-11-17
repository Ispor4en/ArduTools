// ArduTools shell. Opens upstream tools and routes dropped logs.
// Copyright (C) 2026 UnknownTeam
// SPDX-License-Identifier: GPL-3.0-only

const routing = window.ArduRouting

const nav = document.getElementById('nav-list')
const grid = document.getElementById('tile-grid')
const search = document.getElementById('search')
const home = document.getElementById('home')
const frameWrap = document.getElementById('tool-frame')
const iframe = document.getElementById('tool')
const title = document.getElementById('title')
const subtitle = document.getElementById('subtitle')
const homeBtn = document.getElementById('home-btn')
const openBtn = document.getElementById('open-btn')
const shellFiles = document.getElementById('shell-files')
const drop = document.getElementById('drop')
const chooser = document.getElementById('chooser')
const chooserText = document.getElementById('chooser-text')
const chooserActions = document.getElementById('chooser-actions')
const status = document.getElementById('status')
const empty = document.getElementById('empty')
const about = document.getElementById('about')
const multi = document.getElementById('multi')
const multiList = document.getElementById('multi-list')

let catalog = []
let groups = []
let messages = null
let current = null
let currentLang = 'en'
let openSeq = 0
let lastFile = null
let metaInfo = {}
let painting = false

function t(key, vars) {
  const table = messages && messages.shell && messages.shell[key]
  const text = (table && (table[currentLang] || table.en)) || key
  return String(text).replace(/\{(\w+)\}/g, (_match, name) => (vars && vars[name] != null ? vars[name] : ''))
}

function toolCopy(tool, field) {
  const pack = messages && messages.tools && messages.tools[tool.id]
  const value = pack && pack[field]
  if (value && (value[currentLang] || value.en)) return value[currentLang] || value.en
  return tool[field] || tool.name
}

function groupCopy(group) {
  const pack = messages && messages.groups && messages.groups[group.id]
  if (pack && (pack[currentLang] || pack.en)) return pack[currentLang] || pack.en
  return group.label
}

function fallbackLang() {
  const locale = (navigator.language || '').toLowerCase()
  return locale.startsWith('uk') ? 'uk' : 'en'
}

function writeLangCookie(lang) {
  document.cookie = `ardutools_lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`
}

async function setLanguage(lang) {
  if (lang !== 'uk' && lang !== 'en') return
  currentLang = lang
  document.documentElement.lang = lang
  writeLangCookie(lang)
  if (window.ardutools && window.ardutools.setLanguage) await window.ardutools.setLanguage(lang)
  applyChrome()
  render()
  if (current) {
    title.textContent = toolCopy(current, 'name')
    subtitle.textContent = toolCopy(current, 'description')
    document.title = `${toolCopy(current, 'name')} · ArduTools`
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'ardutools-lang', lang }, location.origin)
    }
  }
  document.body.classList.add('i18n-ready')
}

function applyChrome() {
  document.getElementById('skip-link').textContent = t('skip')
  document.getElementById('brand-by').textContent = t('brandBy')
  search.setAttribute('aria-label', t('searchLabel'))
  document.getElementById('search-label').textContent = t('searchLabel')
  search.placeholder = t('searchPlaceholder')
  nav.setAttribute('aria-label', t('navLabel'))
  document.getElementById('tile-grid').setAttribute('aria-label', t('tileGrid'))
  document.getElementById('drop').setAttribute('aria-label', t('dropZone'))
  const langSwitch = document.getElementById('lang-switch')
  langSwitch.setAttribute('aria-label', t('langLabel'))
  document.getElementById('lang-uk').setAttribute('aria-label', t('langUk'))
  document.getElementById('lang-en').setAttribute('aria-label', t('langEn'))
  if (langSwitch.value !== currentLang && langSwitch.api) {
    painting = true
    langSwitch.api.setValue(currentLang)
    painting = false
  }
  document.getElementById('about-btn').textContent = t('aboutBtn')
  openBtn.textContent = t('openFile')
  homeBtn.textContent = t('homeTitle')
  document.getElementById('lede').textContent = t('lede')
  empty.textContent = t('empty')
  document.getElementById('drop-title').textContent = t('dropTitle')
  iframe.title = t('toolFrame')
  document.getElementById('about-heading').textContent = t('aboutHeading')
  document.getElementById('about-body').textContent = t('aboutBody')
  document.getElementById('notice-text').setAttribute('aria-label', t('noticeLabel'))
  document.getElementById('about-close').textContent = t('close')
  document.getElementById('multi-heading').textContent = t('chooseFile')
  document.getElementById('multi-body').textContent = t('chooseFileBody')
  document.getElementById('multi-cancel').textContent = t('cancel')
  document.getElementById('chooser-dismiss').textContent = t('dismiss')
  const short = (metaInfo.upstream || '').slice(0, 8)
  document.getElementById('version-line').textContent = `v${metaInfo.version || ''} · GPL-3.0`
  document.getElementById('about-version').textContent = short
    ? t('aboutVersion', { version: metaInfo.version || '', short })
    : t('aboutVersionShort', { version: metaInfo.version || '' })
  if (!current) {
    title.textContent = t('homeTitle')
    subtitle.textContent = t('homeSubtitle')
    if (!document.hidden) document.title = 'ArduTools'
  }
}

async function boot() {
  const [catalogBody, messageBody, metaBody, initial] = await Promise.all([
    fetch('/__shell/tools.json').then((response) => response.json()),
    fetch('/__shell/messages.json').then((response) => response.json()),
    fetch('/__shell/meta.json').then((response) => response.json()).catch(() => ({})),
    window.ardutools && window.ardutools.getLanguage
      ? window.ardutools.getLanguage()
      : Promise.resolve({ lang: fallbackLang() }),
  ])
  catalog = catalogBody.tools
  groups = catalogBody.groups
  messages = messageBody
  metaInfo = metaBody
  await Promise.all(['ui-listbox', 'ui-tool-grid', 'ui-segmented-control', 'ui-file-input', 'ui-input'].map((tag) => customElements.whenDefined(tag)))
  currentLang = initial.lang === 'uk' ? 'uk' : 'en'
  document.documentElement.lang = currentLang
  writeLangCookie(currentLang)
  applyChrome()
  render()
  document.body.classList.add('i18n-ready')
  window.ardutools.onMenu(onMenu)
  window.ardutools.onOpenPath(({ name, bytes }) => {
    routeFile(new File([bytes], name))
  })
}

function render() {
  painting = true
  const query = search.value.trim().toLowerCase()
  const shown = []
  nav.replaceChildren(listItem('home', t('allTools'), null))
  for (const group of groups) {
    const tools = catalog.filter((tool) => tool.group === group.id && matches(tool, query))
    if (!tools.length) continue
    const groupEl = document.createElement('ui-listbox-group')
    const label = document.createElement('ui-listbox-group-label')
    label.className = 'group-label'
    label.textContent = groupCopy(group)
    groupEl.append(label)
    for (const tool of tools) groupEl.append(listItem(tool.id, toolCopy(tool, 'name'), tool))
    nav.append(groupEl)
    shown.push(...tools)
  }
  grid.replaceChildren()
  shown.forEach((tool, index) => grid.append(tile(tool, index)))
  empty.hidden = shown.length !== 0
  const selected = current ? current.id : 'home'
  if (nav.api && nav.value !== selected) nav.api.setValue(selected)
  painting = false
}

function listItem(value, name, tool) {
  const item = document.createElement('ui-listbox-item')
  item.setAttribute('value', value)
  if (tool) item.append(iconImage(tool, 'nav-icon', 28))
  const copy = document.createElement('span')
  copy.className = 'nav-copy'
  const label = document.createElement('span')
  label.className = 'nav-name'
  label.textContent = name
  copy.append(label)
  item.append(copy)
  return item
}

function matches(tool, query) {
  if (!query) return true
  const pack = messages && messages.tools && messages.tools[tool.id]
  const group = groups.find((item) => item.id === tool.group)
  const haystack = [
    tool.name,
    tool.description,
    tool.group,
    pack && pack.name && pack.name.uk,
    pack && pack.name && pack.name.en,
    pack && pack.description && pack.description.uk,
    pack && pack.description && pack.description.en,
    group && groupCopy({ ...group, id: group.id }),
  ].filter(Boolean).join(' ').toLowerCase()
  return haystack.includes(query)
}

function tile(tool, index) {
  const cell = document.createElement('ui-tool-grid-cell')
  cell.setAttribute('value', tool.id)
  cell.setAttribute('index', String(index))
  const icon = iconImage(tool, 'tile-icon', 72)
  if (index >= 4) icon.loading = 'lazy'
  else icon.setAttribute('fetchpriority', 'high')
  const heading = document.createElement('h2')
  heading.textContent = toolCopy(tool, 'name')
  const text = document.createElement('p')
  text.textContent = toolCopy(tool, 'description')
  cell.append(icon, heading, text)
  if (tool.preview) {
    const badge = document.createElement('span')
    badge.className = 'badge'
    badge.textContent = t('preview')
    cell.append(badge)
  }
  return cell
}

function iconImage(tool, className, size) {
  const image = document.createElement('img')
  image.className = className
  image.src = tool.icon
  image.alt = ''
  image.width = size
  image.height = size
  return image
}

function goHome(returnId) {
  openSeq += 1
  current = null
  iframe.src = 'about:blank'
  frameWrap.hidden = true
  home.hidden = false
  title.textContent = t('homeTitle')
  subtitle.textContent = t('homeSubtitle')
  document.title = 'ArduTools'
  homeBtn.disabled = true
  hideChooser()
  render()
  focusTool(returnId || 'home')
}

function focusTool(id) {
  const cell = grid.querySelector(`[value="${CSS.escape(id)}"]`)
  if (cell && id !== 'home') {
    cell.focus()
    return
  }
  const item = nav.querySelector(`[value="${CSS.escape(id)}"]`)
  if (item) item.focus()
}

async function openTool(id, file) {
  const tool = catalog.find((item) => item.id === id)
  if (!tool) return
  const seq = ++openSeq
  current = tool
  title.textContent = toolCopy(tool, 'name')
  subtitle.textContent = toolCopy(tool, 'description')
  document.title = `${toolCopy(tool, 'name')} · ArduTools`
  homeBtn.disabled = false
  home.hidden = true
  frameWrap.hidden = false
  render()
  status.textContent = t('opening', { name: toolCopy(tool, 'name') })
  const loaded = waitForLoad(seq)
  iframe.src = tool.href
  await loaded
  if (seq !== openSeq) return
  await installBridge()
  if (file) {
    const result = await deliver(file)
    announce(result, tool, file)
  }
}

function waitForLoad(seq) {
  return new Promise((resolve) => {
    function onLoad() {
      iframe.removeEventListener('load', onLoad)
      if (seq === openSeq) resolve()
    }
    iframe.addEventListener('load', onLoad)
  })
}

function installBridge() {
  const doc = iframe.contentDocument
  if (!doc || doc.getElementById('ardutools-bridge')) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = doc.createElement('script')
    script.id = 'ardutools-bridge'
    script.src = '/__shell/file-bridge.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not attach the file bridge'))
    ;(doc.head || doc.documentElement).appendChild(script)
  })
}

function deliver(file) {
  const token = `${Date.now()}-${Math.random()}`
  const result = new Promise((resolve) => {
    function onMessage(event) {
      if (event.origin !== location.origin) return
      const data = event.data
      if (!data || data.type !== 'ardutools-inject-result' || data.token !== token) return
      window.removeEventListener('message', onMessage)
      resolve(data)
    }
    window.addEventListener('message', onMessage)
    setTimeout(() => {
      window.removeEventListener('message', onMessage)
      resolve({ ok: false, reason: 'timeout', name: file.name })
    }, 4000)
  })
  file.arrayBuffer().then((buffer) => {
    iframe.contentWindow.postMessage({
      type: 'ardutools-inject',
      token,
      name: file.name,
      buffer,
    }, location.origin, [buffer])
  })
  return result
}

function announce(result, tool, file) {
  if (result.ok) {
    status.textContent = t('openedStatus', { file: file.name, name: toolCopy(tool, 'name') })
    showChooser(file, tool)
    return
  }
  status.textContent = t('noField', { file: file.name, name: toolCopy(tool, 'name') })
  showChooser(file, tool, true)
}

function showChooser(file, tool, failed) {
  const choice = routing.chooseTool(catalog, file.name, tool.id)
  const alternatives = choice.alternatives || []
  if (!alternatives.length && !failed) {
    hideChooser()
    return
  }
  chooser.hidden = false
  chooserText.textContent = failed
    ? t('noFieldShort', { file: file.name, name: toolCopy(tool, 'name') })
    : t('openedIn', { file: file.name, name: toolCopy(tool, 'name') })
  chooserActions.replaceChildren()
  for (const alternative of alternatives) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'btn'
    button.textContent = toolCopy(alternative, 'name')
    button.addEventListener('click', () => openTool(alternative.id, file))
    chooserActions.appendChild(button)
  }
}

function hideChooser() {
  chooser.hidden = true
  chooserActions.replaceChildren()
}

async function routeFile(file) {
  lastFile = file
  const choice = routing.chooseTool(catalog, file.name, current && current.id)
  if (!choice.tool) {
    status.textContent = t('noTool', { file: file.name })
    chooser.hidden = false
    chooserText.textContent = t('noMatch', { file: file.name })
    chooserActions.replaceChildren()
    return
  }
  if (current && current.id === choice.tool.id) {
    await installBridge()
    const result = await deliver(file)
    announce(result, choice.tool, file)
    return
  }
  await openTool(choice.tool.id, file)
}

function onMenu(command) {
  if (command === 'open' && shellFiles.api) shellFiles.api.open()
  if (command === 'home') goHome()
  if (command === 'reload') {
    if (current) iframe.contentWindow.location.reload()
    else location.reload()
  }
}

search.addEventListener('input', render)
document.getElementById('search-form').addEventListener('submit', (event) => event.preventDefault())
homeBtn.addEventListener('click', goHome)
document.getElementById('chooser-dismiss').addEventListener('click', hideChooser)
document.getElementById('lang-switch').addEventListener('valuechange', (event) => {
  if (painting) return
  const next = event.detail && event.detail.value
  if (next && next !== currentLang) setLanguage(next)
})
nav.addEventListener('valuechange', (event) => {
  if (painting) return
  const value = event.detail && event.detail.value
  if (!value || value === (current ? current.id : 'home')) return
  if (value === 'home') goHome('home')
  else openTool(value)
})
grid.addEventListener('activate', (event) => {
  const value = event.detail && (event.detail.value || event.detail)
  if (typeof value === 'string') openTool(value)
})
shellFiles.addEventListener('valuechange', (event) => {
  const added = (event.detail && (event.detail.added || event.detail.value)) || []
  const files = [...added].map((item) => (item instanceof File ? item : item && item.file)).filter(Boolean)
  if (files.length > 1) chooseOne(files)
  else if (files[0]) routeFile(files[0])
  if (shellFiles.api) shellFiles.api.setValue([])
})
document.getElementById('about-btn').addEventListener('click', async () => {
  const notice = document.getElementById('notice-text')
  if (!notice.textContent) {
    notice.textContent = await fetch('/__shell/NOTICE').then((response) => response.text()).catch(() => t('noticeMissing'))
  }
  about.showModal()
})

window.addEventListener('message', (event) => {
  if (event.origin !== location.origin) return
  if (event.data && event.data.type === 'ardutools-external') {
    window.ardutools.openExternal(event.data.url)
  }
  if (event.data && event.data.type === 'ardutools-escape') onEscape()
  if (event.data && event.data.type === 'ardutools-search') focusSearch()
})

window.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    focusSearch()
    return
  }
  if (event.key === '/' && !isTyping(event.target)) {
    event.preventDefault()
    focusSearch()
    return
  }
  if (event.key === 'Escape') onEscape()
})

function isTyping(target) {
  if (!target || target === search) return false
  const name = target.tagName
  return name === 'INPUT' || name === 'TEXTAREA' || target.isContentEditable
}

function focusSearch() {
  search.focus()
  search.select()
}

function onEscape() {
  if (search.value) {
    search.value = ''
    search.dispatchEvent(new Event('input', { bubbles: true }))
    search.focus()
    return
  }
  if (!current) return
  const returnId = current.id
  goHome(returnId)
}

function chooseOne(files) {
  multiList.replaceChildren()
  for (const file of files) {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = file.name
    button.addEventListener('click', () => {
      multi.close()
      routeFile(file)
    })
    multiList.appendChild(button)
  }
  multi.showModal()
}

window.__ardutoolsSmoke = {
  open(id) { return openTool(id) },
  status() {
    let href = ''
    let textLength = 0
    let titleText = ''
    let ready = ''
    try {
      href = iframe.contentWindow.location.href
      ready = iframe.contentDocument.readyState
      textLength = (iframe.contentDocument.body && iframe.contentDocument.body.textContent || '').replace(/\s+/g, ' ').trim().length
      titleText = iframe.contentDocument.title || ''
    } catch {
      // about:blank is reachable on the same origin in this app.
    }
    return { href, textLength, title: titleText, ready }
  },
  async dropText(name, text) {
    return deliver(new File([text], name))
  },
  fileCount() {
    const input = iframe.contentDocument && iframe.contentDocument.querySelector('#fileItem, #paramFile, #param_file, #fileInput, #log-input, input[type="file"]:not([disabled])')
    return input && input.files ? input.files.length : 0
  },
  has(name) {
    try {
      return typeof iframe.contentWindow[name] !== 'undefined'
    } catch {
      return false
    }
  },
  async setLang(lang) {
    await setLanguage(lang)
    return document.documentElement.lang
  },
  async homeUk() {
    await setLanguage('uk')
    goHome()
    return document.documentElement.lang
  },
}

boot().catch((error) => {
  status.textContent = messages ? t('bootError') : 'The tool list failed to load.'
  console.error(error)
})
