const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { startServer } = require('../src/server')

const root = path.join(__dirname, '..')

test('local server serves the shell, a tool, and refuses traversal', async () => {
  const server = await startServer({
    shellDir: path.join(root, 'shell'),
    sharedDir: path.join(root, 'shared'),
    webtoolsDir: path.join(root, 'upstream', 'WebTools'),
    vendorRuntimeDir: path.join(root, 'vendor', 'runtime'),
    noticePath: path.join(root, 'NOTICE'),
    version: '1.0.0',
    upstreamCommit: 'abc',
    neutralizeDialogs: true,
  })
  try {
    const home = await fetch(`${server.origin}/`)
    const homeText = await home.text()
    assert.equal(home.status, 200)
    assert.match(homeText, /ArduTools/)
    assert.match(homeText, /by UnknownTeam/)
    assert.equal(homeText.includes('UAV Log viewer'), false)
    assert.match(homeText, /window\.alert=function/)

    const redirect = await fetch(`${server.origin}/MAGFit`, { redirect: 'manual' })
    assert.equal(redirect.status, 302)
    assert.equal(redirect.headers.get('location'), '/MAGFit/')

    const tool = await fetch(`${server.origin}/MAGFit/`)
    const toolText = await tool.text()
    assert.equal(tool.status, 200)
    assert.match(toolText, /MAGFit/)
    assert.match(toolText, /window\.alert=function/)
    assert.match(toolText, /\/__shell\/tool-i18n\.js/)

    const meta = await fetch(`${server.origin}/__shell/meta.json`)
    assert.deepEqual(await meta.json(), { version: '1.0.0', upstream: 'abc' })

    const escaped = await fetch(`${server.origin}/..%2F..%2Fetc/passwd`)
    assert.notEqual(escaped.status, 200)

    const config = await fetch(`${server.origin}/SimpleGCS/config.js`)
    assert.equal(config.status, 200)
    assert.match(config.headers.get('content-type'), /javascript/)
    assert.match(await config.text(), /SIMPLEGCS_CONFIG/)

    const notice = await fetch(`${server.origin}/__shell/NOTICE`)
    assert.equal(notice.status, 200)
    assert.match(await notice.text(), /ArduPilot WebTools/)

    const plotlyPath = path.join(root, 'vendor', 'runtime', 'modules', 'plotly.js', 'dist', 'plotly.min.js')
    if (fs.existsSync(plotlyPath)) {
      const plotly = await fetch(`${server.origin}/modules/plotly.js/dist/plotly.min.js`)
      assert.equal(plotly.status, 200)
      assert.match(plotly.headers.get('content-type'), /javascript/)
      assert.ok((await plotly.arrayBuffer()).byteLength > 500000)
    }
  } finally {
    await server.close()
  }
})
