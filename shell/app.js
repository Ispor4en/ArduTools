// ArduTools shell. Opens upstream tools and routes dropped logs.
// Copyright (C) 2026 UnknownTeam
// SPDX-License-Identifier: GPL-3.0-only

const routing = window.ArduRouting

const nav = document.getElementById('nav')
const grid = document.getElementById('tile-grid')
const search = document.getElementById('search')
const home = document.getElementById('home')
const frameWrap = document.getElementById('tool-frame')
const iframe = document.getElementById('tool')
const title = document.getElementById('title')
const subtitle = document.getElementById('subtitle')
const homeBtn = document.getElementById('home-btn')
const openBtn = document.getElementById('open-btn')
const filePicker = document.getElementById('file-picker')
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
let dragDepth = 0
let metaInfo = {}

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
  document.getElementById('search').setAttribute('aria-label', t('searchLabel'))
  document.querySelector('label[for="search"]').textContent = t('searchLabel')
  search.placeholder = t('searchPlaceholder')
  nav.setAttribute('aria-label', t('navLabel'))
  document.getElementById('lang-switch').setAttribute('aria-label', t('langLabel'))
  document.getElementById('lang-uk').setAttribute('aria-label', t('langUk'))
  document.getElementById('lang-uk').setAttribute('aria-pressed', currentLang === 'uk' ? 'true' : 'false')
  document.getElementById('lang-en').setAttribute('aria-label', t('langEn'))
  document.getElementById('lang-en').setAttribute('aria-pressed', currentLang === 'en' ? 'true' : 'false')
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
  const query = search.value.trim().toLowerCase()
  nav.replaceChildren()
  grid.replaceChildren()
  const homeButton = document.createElement('button')
  homeButton.type = 'button'
  homeButton.className = 'nav-btn'
  homeButton.textContent = t('allTools')
  if (!current) homeButton.setAttribute('aria-current', 'page')
  homeButton.addEventListener('click', goHome)
  nav.appendChild(homeButton)

  let shown = 0
  for (const group of groups) {
    const tools = catalog.filter((tool) => tool.group === group.id && matches(tool, query))
    if (!tools.length) continue
    const label = document.createElement('h2')
    label.className = 'group-label'
    label.textContent = groupCopy(group)
    nav.appendChild(label)
    for (const tool of tools) {
      nav.appendChild(navButton(tool))
      grid.appendChild(tile(tool, shown < 4))
      shown += 1
    }
  }
  empty.hidden = shown !== 0
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

function navButton(tool) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'nav-btn'
  button.dataset.tool = tool.id
  if (current && current.id === tool.id) button.setAttribute('aria-current', 'page')
  const icon = iconImage(tool, 'nav-icon', 28)
  const copy = document.createElement('span')
  copy.className = 'nav-copy'
  const name = document.createElement('span')
  name.className = 'nav-name'
  name.textContent = toolCopy(tool, 'name')
  copy.append(name)
  button.append(icon, copy)
  button.addEventListener('click', () => openTool(tool.id))
  return button
}

function tile(tool, eager) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'tile'
  const icon = iconImage(tool, 'tile-icon', 72)
  if (!eager) icon.loading = 'lazy'
  else icon.setAttribute('fetchpriority', 'high')
  const heading = document.createElement('h2')
  heading.textContent = toolCopy(tool, 'name')
  const text = document.createElement('p')
  text.textContent = toolCopy(tool, 'description')
  button.append(icon, heading, text)
  if (tool.preview) {
    const badge = document.createElement('span')
    badge.className = 'badge'
    badge.textContent = t('preview')
    button.append(badge)
  }
  button.addEventListener('click', () => openTool(tool.id))
  return button
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

function goHome() {
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
  if (command === 'open') filePicker.click()
  if (command === 'home') goHome()
  if (command === 'reload') {
    if (current) iframe.contentWindow.location.reload()
    else location.reload()
  }
}

search.addEventListener('input', render)
document.getElementById('search-form').addEventListener('submit', (event) => event.preventDefault())
homeBtn.addEventListener('click', goHome)
openBtn.addEventListener('click', () => filePicker.click())
filePicker.addEventListener('change', () => {
  const file = filePicker.files && filePicker.files[0]
  if (file) routeFile(file)
  filePicker.value = ''
})
document.getElementById('chooser-dismiss').addEventListener('click', hideChooser)
document.getElementById('lang-uk').addEventListener('click', () => setLanguage('uk'))
document.getElementById('lang-en').addEventListener('click', () => setLanguage('en'))
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
})

window.addEventListener('dragenter', (event) => {
  if (!hasFiles(event)) return
  dragDepth += 1
  drop.hidden = false
})
window.addEventListener('dragover', (event) => {
  if (!hasFiles(event)) return
  event.preventDefault()
  drop.hidden = false
})
window.addEventListener('dragleave', () => {
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) drop.hidden = true
})
window.addEventListener('drop', (event) => {
  if (!hasFiles(event)) return
  event.preventDefault()
  dragDepth = 0
  drop.hidden = true
  const files = [...event.dataTransfer.files]
  const directory = [...event.dataTransfer.items].some((item) => {
    const entry = item.webkitGetAsEntry && item.webkitGetAsEntry()
    return entry && entry.isDirectory
  })
  if (directory && !files.length) {
    status.textContent = t('folderHint')
    openTool('LogFinder')
    return
  }
  if (files.length > 1) {
    chooseOne(files)
    return
  }
  if (files[0]) routeFile(files[0])
})

function hasFiles(event) {
  return event.dataTransfer && [...event.dataTransfer.types].includes('Files')
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
