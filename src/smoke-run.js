// ArduTools — desktop shell for ArduPilot WebTools.
// Copyright (C) 2026 UnknownTeam
// SPDX-License-Identifier: GPL-3.0-only

const fs = require('fs')
const path = require('path')

const MARKERS = {
  MAGFit: 'Plotly',
  FilterReview: 'Plotly',
  PIDReview: 'Plotly',
  FilterTool: 'Plotly',
  HardwareReport: 'Plotly',
  AirspeedFit: 'Plotly',
  AnalyticTune: 'Plotly',
  ThrustExpo: 'Plotly',
  StreamStats: 'Plotly',
  KinematicTool: 'Plotly',
  KinematicToolPlane: 'Plotly',
  SCurveTool: 'Plotly',
  RotationCheck: 'Plotly',
  SysID: 'loadPyodide',
  GeofenceGenerator: 'L',
  LogFinder: 'Tabulator',
  SimpleGCS: 'L',
  TelemetryDashboard: 'GridStack',
  VideoOverlay: 'luxon',
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function runSmoke(win, paths) {
  const catalog = JSON.parse(await fs.promises.readFile(path.join(paths.shellDir, 'tools.json'), 'utf8'))
  const outDir = process.env.ARDUTOOLS_SCREENSHOT_DIR
    || path.join(path.dirname(paths.shellDir), 'docs', 'screenshots')
  await fs.promises.mkdir(outDir, { recursive: true })

  const consoleErrors = []
  win.webContents.on('console-message', (event) => {
    if (event.level === 'error' && event.message) {
      consoleErrors.push(`${event.sourceId || ''}: ${event.message}`.slice(0, 400))
    }
  })

  await sleep(800)
  await fs.promises.writeFile(path.join(outDir, 'home.png'), (await win.webContents.capturePage()).toPNG())

  const results = []
  let fileCount = 0
  let injected = null
  for (const tool of catalog.tools) {
    const result = await openAndCheck(win, tool)
    results.push(result)
    if (tool.id === 'MAGFit' && result.ok) {
      injected = await win.webContents.executeJavaScript(`window.__ardutoolsSmoke.dropText(${JSON.stringify('smoke.bin')}, 'ardutools')`)
      fileCount = await win.webContents.executeJavaScript('window.__ardutoolsSmoke.fileCount()')
      await sleep(500)
      await fs.promises.writeFile(path.join(outDir, 'magfit.png'), (await win.webContents.capturePage()).toPNG())
    }
  }

  const report = { results, injected, fileCount, consoleErrors: consoleErrors.slice(0, 60) }
  await fs.promises.writeFile(path.join(outDir, 'smoke-report.json'), JSON.stringify(report, null, 2))
  const failed = results.filter((item) => !item.ok)
  if (failed.length || fileCount < 1) {
    console.error(JSON.stringify({ failed, fileCount, injected }, null, 2))
    return 1
  }
  console.log(`Smoke ok: ${results.length} tools, injected file count ${fileCount}`)
  return 0
}

async function openAndCheck(win, tool) {
  await win.webContents.executeJavaScript(`window.__ardutoolsSmoke.open(${JSON.stringify(tool.id)})`)
  const started = Date.now()
  let last = { href: '', textLength: 0, title: '', ready: '' }
  while (Date.now() - started < 20000) {
    last = await win.webContents.executeJavaScript('window.__ardutoolsSmoke.status()')
    const marker = MARKERS[tool.id]
    const markerReady = marker
      ? await win.webContents.executeJavaScript(`window.__ardutoolsSmoke.has(${JSON.stringify(marker)})`)
      : true
    if ((last.href || '').includes(tool.href) && last.ready === 'complete' && last.textLength > 40 && markerReady) {
      return { id: tool.id, ok: true, title: last.title, textLength: last.textLength, href: last.href }
    }
    await sleep(200)
  }
  return { id: tool.id, ok: false, ...last }
}

module.exports = { runSmoke }
