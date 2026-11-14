// ArduTools — desktop shell for ArduPilot WebTools.
// Copyright (C) 2026 UnknownTeam
// SPDX-License-Identifier: GPL-3.0-only

const { app, BrowserWindow, Menu, dialog, session, shell, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')
const { startServer } = require('./server')
const { installOfflineMirror } = require('./offline-protocol')
const { runSmoke } = require('./smoke-run')

const SMOKE = process.env.ARDUTOOLS_SMOKE === '1'

if (process.env.ARDUTOOLS_NO_SANDBOX === '1' || SMOKE) {
  app.commandLine.appendSwitch('no-sandbox')
  app.commandLine.appendSwitch('disable-gpu')
}
if (SMOKE) app.commandLine.appendSwitch('force-device-scale-factor', '1')

const FILE_ARG = /\.(bin|param|parm|tlog|log|txt|json|mp4|mov|webm|mkv|avi|m4v)$/i

function roots() {
  const packaged = app.isPackaged
  const resourceRoot = packaged ? process.resourcesPath : path.join(__dirname, '..')
  return {
    shellDir: path.join(resourceRoot, 'shell'),
    sharedDir: packaged ? path.join(resourceRoot, 'shared') : path.join(__dirname, '..', 'shared'),
    webtoolsDir: path.join(resourceRoot, packaged ? 'webtools' : path.join('upstream', 'WebTools')),
    vendorRuntimeDir: path.join(resourceRoot, 'vendor', 'runtime'),
    vendorCdnDir: path.join(resourceRoot, 'vendor', 'cdn'),
    noticePath: packaged ? path.join(resourceRoot, 'NOTICE') : path.join(__dirname, '..', 'NOTICE'),
    iconPath: packaged ? path.join(resourceRoot, 'icon.png') : path.join(__dirname, '..', 'build', 'icon.png'),
  }
}

function readUpstreamCommit() {
  const candidates = app.isPackaged
    ? [path.join(process.resourcesPath, 'UPSTREAM.json')]
    : [path.join(__dirname, '..', 'upstream', 'UPSTREAM.json')]
  for (const file of candidates) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8')).commit || ''
    } catch {
      // Try the next location.
    }
  }
  return ''
}

function extractFile(argv) {
  for (const arg of argv) {
    if (!arg || arg.startsWith('-') || !FILE_ARG.test(arg)) continue
    try {
      if (fs.existsSync(arg) && fs.statSync(arg).isFile()) return path.resolve(arg)
    } catch {
      // Ignore arguments that are not readable files.
    }
  }
  return null
}

function safeExternal(url) {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:') {
      return parsed.href
    }
  } catch {
    return null
  }
  return null
}

let mainWindow = null
let origin = ''

function allowDevice(details) {
  return details.deviceType === 'usb' || details.deviceType === 'serial' || details.deviceType === 'hid'
}

function openHandler(url) {
  if (!url || url === 'about:blank') return { action: 'allow' }
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return { action: 'deny' }
  }
  if (origin && parsed.origin === origin) {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        width: 1200,
        height: 800,
        backgroundColor: '#ffffff',
        autoHideMenuBar: true,
        title: 'ArduTools',
        webPreferences: webPreferences(),
      },
    }
  }
  const external = safeExternal(url)
  if (external) shell.openExternal(external)
  return { action: 'deny' }
}

function webPreferences() {
  return {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false,
    spellcheck: false,
  }
}

function buildMenu() {
  const send = (command) => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('menu:command', command)
  }
  return Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { label: 'Open file…', accelerator: 'CmdOrCtrl+O', click: () => send('open') },
        { label: 'Home', accelerator: 'CmdOrCtrl+Shift+H', click: () => send('home') },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => send('reload') },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About ArduTools',
          click: () => {
            const version = app.getVersion()
            dialog.showMessageBox({
              type: 'info',
              title: 'About ArduTools',
              message: 'ArduTools by UnknownTeam',
              detail: `Version ${version}\n\nOffline desktop shell for ArduPilot WebTools.\nWebTools is GPL-3.0 software by the ArduPilot project.\n\nhttps://github.com/ArduPilot/WebTools`,
            })
          },
        },
        {
          label: 'ArduPilot WebTools source',
          click: () => shell.openExternal('https://github.com/ArduPilot/WebTools'),
        },
      ],
    },
  ])
}

async function createWindow(startupFile) {
  const paths = roots()
  const version = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).version
  const started = await startServer({
    shellDir: paths.shellDir,
    sharedDir: paths.sharedDir,
    webtoolsDir: paths.webtoolsDir,
    vendorRuntimeDir: paths.vendorRuntimeDir,
    noticePath: paths.noticePath,
    version,
    upstreamCommit: readUpstreamCommit(),
    neutralizeDialogs: SMOKE,
    port: 0,
  })
  origin = started.origin

  installOfflineMirror(session.defaultSession, paths.vendorCdnDir)
  session.defaultSession.setDevicePermissionHandler((details) => allowDevice(details))
  session.defaultSession.setPermissionRequestHandler((_contents, permission, callback) => {
    callback(['usb', 'serial', 'hid', 'media', 'clipboard-sanitized-write', 'fullscreen', 'pointerLock'].includes(permission))
  })

  const icon = fs.existsSync(paths.iconPath) ? paths.iconPath : undefined
  mainWindow = new BrowserWindow({
    width: SMOKE ? 1560 : 1440,
    height: SMOKE ? 960 : 900,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    backgroundColor: '#10161d',
    title: 'ArduTools',
    autoHideMenuBar: true,
    icon,
    webPreferences: webPreferences(),
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  await mainWindow.loadURL(`${origin}/`)

  if (startupFile) mainWindow.webContents.send('file:open-path', startupFile)

  if (SMOKE) {
    const code = await runSmoke(mainWindow, paths)
    started.close()
    app.exit(code)
  }
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
    const file = extractFile(argv)
    if (file) mainWindow.webContents.send('file:open-path', file)
  })

  app.whenReady().then(() => {
    app.setAppUserModelId('com.unknownteam.ardutools')
    Menu.setApplicationMenu(buildMenu())
    ipcMain.handle('shell:open-external', (_event, url) => {
      const safe = safeExternal(url)
      if (safe) return shell.openExternal(safe)
      return false
    })
    app.on('web-contents-created', (_event, contents) => {
      contents.setWindowOpenHandler(({ url }) => openHandler(url))
      contents.on('will-navigate', (event, url) => {
        if (!origin) return
        if (url.startsWith(origin) || url.startsWith('about:') || url.startsWith('devtools:')) return
        event.preventDefault()
        const safe = safeExternal(url)
        if (safe) shell.openExternal(safe)
      })
    })
    return createWindow(extractFile(process.argv))
  }).catch((error) => {
    console.error(error)
    dialog.showErrorBox('ArduTools failed to start', String(error && error.stack || error))
    app.exit(1)
  })

  app.on('window-all-closed', () => {
    if (!SMOKE) app.quit()
  })
}
