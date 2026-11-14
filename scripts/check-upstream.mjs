// Compare the pinned ArduPilot WebTools commit with origin/main.
// Copyright (C) 2026 UnknownTeam
// SPDX-License-Identifier: GPL-3.0-only

import { execFileSync } from 'node:child_process'
import { appendFileSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const webtools = path.join(root, 'upstream', 'WebTools')
const apply = process.argv.includes('--apply')
const ignore = new Set(['Libraries', 'modules', 'images', 'tests', '.github', '.vscode', 'Dev', 'node_modules'])

function output(name, value) {
  const line = `${name}=${value}\n`
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, line)
  else process.stdout.write(line)
}

const remoteLine = execFileSync('git', ['ls-remote', 'https://github.com/ArduPilot/WebTools.git', 'refs/heads/main'], {
  encoding: 'utf8',
}).trim()
const remote = remoteLine.split(/\s+/)[0]
const local = execFileSync('git', ['-C', webtools, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()

const catalog = JSON.parse(readFileSync(path.join(root, 'shell', 'tools.json'), 'utf8'))

function exists(file) {
  try {
    return statSync(file).isFile()
  } catch {
    return false
  }
}

const toolDirs = readdirSync(webtools).filter((name) => {
  if (ignore.has(name) || name.startsWith('.')) return false
  return exists(path.join(webtools, name, 'index.html'))
})
const missing = toolDirs.filter((name) => !catalog.tools.some((tool) => tool.href === `/${name}/` || tool.href.startsWith(`/${name}/`)))

output('update', remote !== local ? 'true' : 'false')
output('sha', remote)
output('short', remote.slice(0, 12))
output('local', local)
output('missing', missing.join(' '))

if (apply && remote !== local) {
  execFileSync('git', ['-C', webtools, 'fetch', '--depth', '1', 'origin', remote], { stdio: 'inherit' })
  execFileSync('git', ['-C', webtools, 'checkout', '--detach', 'FETCH_HEAD'], { stdio: 'inherit' })
  const pin = {
    repo: 'https://github.com/ArduPilot/WebTools',
    branch: 'main',
    commit: remote,
  }
  writeFileSync(path.join(root, 'upstream', 'UPSTREAM.json'), `${JSON.stringify(pin, null, 2)}\n`)
}

const body = [
  'Scheduled check of [ArduPilot/WebTools](https://github.com/ArduPilot/WebTools) `main`.',
  '',
  `- Pinned: \`${local}\``,
  `- Upstream: \`${remote}\``,
  '',
  missing.length
    ? `New top-level tool folders are not in \`shell/tools.json\` yet: ${missing.map((name) => `\`${name}\``).join(', ')}. Add a tile before release.`
    : 'Every current top-level tool folder already has a tile.',
  '',
  'Runtime libraries are not stored in git. After this lands, `npm run sync` rebuilds `vendor/` from the new pin.',
].join('\n')
writeFileSync(path.join(root, 'upstream-pr-body.md'), `${body}\n`)
console.log(body)
