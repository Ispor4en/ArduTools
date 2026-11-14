// ArduTools — desktop shell for ArduPilot WebTools.
// Copyright (C) 2026 UnknownTeam
// SPDX-License-Identifier: GPL-3.0-only

const path = require('path')

function safeJoin(root, ...parts) {
  const cleaned = []
  for (const part of parts) {
    if (part == null || part === '') continue
    if (String(part).includes('\0')) return null
    cleaned.push(String(part))
  }
  const base = path.resolve(root)
  const target = path.resolve(base, ...cleaned)
  const relative = path.relative(base, target)
  if (relative === '') return base
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null
  return target
}

module.exports = { safeJoin }
