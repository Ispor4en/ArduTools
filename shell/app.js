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
let current = null
let openSeq = 0
let lastFile = null
let dragDepth = 0

const HOME_SUBTITLE = 'Drop a .bin, .log, or .param file anywhere in this window.'

async function boot() {
  const response = await fetch('/__shell/tools.json')
  const body = await response.json()
  catalog = body.tools
  groups = body.groups
  render()
  const meta = await fetch('/__shell/meta.json').then((item) => item.json()).catch(() => ({}))
  const short = (meta.upstream || '').slice(0, 8)
  document.getElementById('version-line').textContent = `v${meta.version || ''} · GPL-3.0`
  document.getElementById('about-version').textContent = short
    ? `Version ${meta.version}. WebTools ${short}.`
    : `Version ${meta.version || '1.0.0'}.`
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
  homeButton.textContent = 'All tools'
  if (!current) homeButton.setAttribute('aria-current', 'page')
  homeButton.addEventListener('click', goHome)
  nav.appendChild(homeButton)

  let shown = 0
  for (const group of groups) {
    const tools = catalog.filter((tool) => tool.group === group.id && matches(tool, query))
    if (!tools.length) continue
    const label = document.createElement('h2')
    label.className = 'group-label'
    label.textContent = group.label
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
  return `${tool.name} ${tool.description} ${tool.group}`.toLowerCase().includes(query)
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
  name.textContent = tool.name
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
  heading.textContent = tool.name
  const text = document.createElement('p')
  text.textContent = tool.description
  button.append(icon, heading, text)
  if (tool.preview) {
    const badge = document.createElement('span')
    badge.className = 'badge'
    badge.textContent = 'Preview'
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
  title.textContent = 'Home'
  subtitle.textContent = HOME_SUBTITLE
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
  title.textContent = tool.name
  subtitle.textContent = tool.description
  document.title = `${tool.name} · ArduTools`
  homeBtn.disabled = false
  home.hidden = true
  frameWrap.hidden = false
  render()
  status.textContent = `Opening ${tool.name}`
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
    status.textContent = `${file.name} opened in ${tool.name}`
    showChooser(file, tool)
    return
  }
  status.textContent = `${tool.name} has no file field for ${file.name}. Use the controls inside the tool.`
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
    ? `${file.name} did not load in ${tool.name}.`
    : `${file.name} is open in ${tool.name}.`
  chooserActions.replaceChildren()
  for (const alternative of alternatives) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'btn'
    button.textContent = alternative.name
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
    status.textContent = `No tool accepts ${file.name}.`
    chooser.hidden = false
    chooserText.textContent = `${file.name} does not match a log or parameter tool.`
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
document.getElementById('about-btn').addEventListener('click', async () => {
  const notice = document.getElementById('notice-text')
  if (!notice.textContent) {
    notice.textContent = await fetch('/__shell/NOTICE').then((response) => response.text()).catch(() => 'License notice unavailable.')
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
    status.textContent = 'Log Finder scans a folder from its Search directory button.'
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
}

boot().catch((error) => {
  status.textContent = 'The tool list failed to load.'
  console.error(error)
})
