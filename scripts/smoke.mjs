import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const electron = require('electron')
const root = path.resolve(import.meta.dirname, '..')

const child = spawn(electron, ['.'], {
  cwd: root,
  env: {
    ...process.env,
    ARDUTOOLS_SMOKE: '1',
    ARDUTOOLS_NO_SANDBOX: '1',
    ARDUTOOLS_OFFLINE: '1',
  },
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`electron stopped by ${signal}`)
    process.exitCode = 1
    return
  }
  process.exitCode = code || 0
})
