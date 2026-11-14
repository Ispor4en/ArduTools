const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { PREFERENCE } = require('../shared/routing')

const root = path.join(__dirname, '..')
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'shell', 'tools.json'), 'utf8'))
const webtools = path.join(root, 'upstream', 'WebTools')
const ignore = new Set(['Libraries', 'modules', 'images', 'tests', '.github', '.vscode', 'Dev', 'node_modules'])

test('every upstream tool folder has a tile', () => {
  const folders = fs.readdirSync(webtools).filter((name) => {
    if (ignore.has(name) || name.startsWith('.')) return false
    return fs.existsSync(path.join(webtools, name, 'index.html'))
  })
  const missing = folders.filter((name) => !catalog.tools.some((tool) => tool.href.startsWith(`/${name}/`)))
  assert.deepEqual(missing, [])
})

test('catalog ids, paths, and icons are unique and present', () => {
  const ids = new Set()
  for (const tool of catalog.tools) {
    assert.equal(ids.has(tool.id), false, tool.id)
    ids.add(tool.id)
    assert.ok(tool.href.endsWith('/'), tool.id)
    assert.equal(fs.existsSync(path.join(webtools, tool.href.replace(/^\/+/, ''))), true, tool.href)
    const icon = path.join(webtools, tool.icon.replace(/^\/+/, ''))
    assert.equal(fs.existsSync(icon), true, tool.icon)
  }
})

test('drop preferences point at catalog ids', () => {
  const ids = new Set(catalog.tools.map((tool) => tool.id))
  for (const [ext, list] of Object.entries(PREFERENCE)) {
    assert.ok(list.length > 0, ext)
    for (const id of list) assert.equal(ids.has(id), true, `${ext} ${id}`)
  }
})
