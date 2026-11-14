// ArduTools — desktop shell for ArduPilot WebTools.
// Copyright (C) 2026 UnknownTeam
// SPDX-License-Identifier: GPL-3.0-only

;(function (root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  root.ArduRouting = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.webm', '.mkv', '.avi', '.m4v'])

  const PREFERENCE = {
    '.bin': ['MAGFit', 'FilterReview', 'PIDReview', 'HardwareReport', 'AirspeedFit', 'AnalyticTune', 'StreamStats', 'SysID', 'VideoOverlay', 'AILogAnalyzer'],
    '.param': ['HardwareReport', 'FilterTool', 'ThrustExpo'],
    '.parm': ['HardwareReport', 'FilterTool', 'ThrustExpo'],
    '.tlog': ['StreamStats'],
    '.log': ['AILogAnalyzer'],
    '.txt': ['ThrustExpo'],
    '.json': ['TelemetryDashboard', 'VideoOverlay'],
  }

  function extensionOf(name) {
    const base = String(name || '').split(/[/\\]/).pop()
    const dot = base.lastIndexOf('.')
    if (dot <= 0) return ''
    return base.slice(dot).toLowerCase()
  }

  function candidatesFor(tools, filename) {
    const ext = extensionOf(filename)
    const byId = new Map(tools.map((tool) => [tool.id, tool]))
    const preferred = PREFERENCE[ext]
    if (preferred) return preferred.map((id) => byId.get(id)).filter(Boolean)
    if (VIDEO_EXTENSIONS.has(ext)) return [byId.get('VideoOverlay')].filter(Boolean)
    return tools.filter((tool) => (tool.accept || []).some((item) => item.toLowerCase() === ext))
  }

  function chooseTool(tools, filename, currentId) {
    const list = candidatesFor(tools, filename)
    if (!list.length) return { tool: null, alternatives: [] }
    const current = list.find((tool) => tool.id === currentId)
    const tool = current || list[0]
    return {
      tool,
      alternatives: list.filter((item) => item.id !== tool.id),
    }
  }

  function toolForPath(tools, pathname) {
    let path = String(pathname || '/')
    if (!path.endsWith('/')) {
      if (path.endsWith('.html')) path = path.slice(0, path.lastIndexOf('/') + 1)
      else path += '/'
    }
    const matches = tools.filter((tool) => path.startsWith(tool.href))
    matches.sort((a, b) => b.href.length - a.href.length)
    return matches[0] || null
  }

  return {
    VIDEO_EXTENSIONS,
    PREFERENCE,
    extensionOf,
    candidatesFor,
    chooseTool,
    toolForPath,
  }
})
