// ArduTools — desktop shell for ArduPilot WebTools.
// Copyright (C) 2026 UnknownTeam
// SPDX-License-Identifier: GPL-3.0-only

const { contextBridge, ipcRenderer } = require('electron')
const fs = require('fs')
const path = require('path')

contextBridge.exposeInMainWorld('ardutools', {
  openExternal(url) {
    return ipcRenderer.invoke('shell:open-external', url)
  },
  onOpenPath(callback) {
    ipcRenderer.on('file:open-path', async (_event, filePath) => {
      const bytes = await fs.promises.readFile(filePath)
      callback({ name: path.basename(filePath), bytes: new Uint8Array(bytes) })
    })
  },
  onMenu(callback) {
    ipcRenderer.on('menu:command', (_event, command) => callback(command))
  },
  getLanguage() {
    return ipcRenderer.invoke('lang:get')
  },
  setLanguage(lang) {
    return ipcRenderer.invoke('lang:set', lang)
  },
})

window.addEventListener('DOMContentLoaded', () => {
  const pathName = window.location.pathname
  const shellPage = pathName === '/' || pathName === '/index.html' || pathName.startsWith('/__shell')
  if (shellPage || window.top !== window) return
  const script = document.createElement('script')
  script.src = `${window.location.origin}/__shell/file-bridge.js`
  document.documentElement.appendChild(script)
})
