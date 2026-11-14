// ArduTools — desktop shell for ArduPilot WebTools.
// Copyright (C) 2026 UnknownTeam
// SPDX-License-Identifier: GPL-3.0-only

function langFromLocale(locale, saved) {
  if (saved === 'uk' || saved === 'en') return saved
  return String(locale || '').toLowerCase().startsWith('uk') ? 'uk' : 'en'
}

module.exports = { langFromLocale }
