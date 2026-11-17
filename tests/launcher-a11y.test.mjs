import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { JSDOM } from 'jsdom'

function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function mount() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://127.0.0.1/',
    pretendToBeVisual: true,
    runScripts: 'dangerously',
  })
  const { window } = dom
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.CSS = { escape: (value) => String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&') }
  window.HTMLElement.prototype.attachInternals = function attachInternals() {
    const states = new Set()
    return {
      setFormValue() {},
      setValidity() {},
      checkValidity: () => true,
      reportValidity: () => true,
      states,
    }
  }
  window.Element.prototype.scrollIntoView = () => {}
  window.eval(readFileSync(new URL('../shell/launcher-ui.js', import.meta.url), 'utf8'))
  window.document.body.innerHTML = `
    <ui-field>
      <ui-field-label for="search">Find a tool</ui-field-label>
      <ui-input><input id="search" type="search" aria-label="Find a tool"></ui-input>
    </ui-field>
    <ui-listbox id="nav" activation="manual" aria-label="Tools">
      <ui-listbox-item value="home">All tools</ui-listbox-item>
      <ui-listbox-item value="MAGFit">MAGFit</ui-listbox-item>
    </ui-listbox>
    <ui-tool-grid id="tiles" aria-label="Tool tiles">
      <ui-tool-grid-cell value="MAGFit" index="0"><h2>MAGFit</h2></ui-tool-grid-cell>
      <ui-tool-grid-cell value="FilterReview" index="1"><h2>Filter Review</h2></ui-tool-grid-cell>
    </ui-tool-grid>
    <ui-segmented-control id="lang" aria-label="Language" value="en">
      <ui-segmented-control-item value="uk">UK</ui-segmented-control-item>
      <ui-segmented-control-item value="en">EN</ui-segmented-control-item>
    </ui-segmented-control>
    <ui-file-input>
      <ui-file-input-trigger><ui-button><button type="button">Open file</button></ui-button></ui-file-input-trigger>
      <ui-file-input-dropzone aria-label="Drop a log or parameter file"></ui-file-input-dropzone>
    </ui-file-input>
  `
  return dom
}

test('an agent can name the launcher controls', async () => {
  const dom = mount()
  await tick()
  const agent = dom.window.__uiSdkCreateAgent()
  const labels = agent.snapshot().filter((entry) => !entry.offPage).map((entry) => entry.label)
  for (const label of ['Find a tool', 'Tools', 'Tool tiles', 'Language', 'Open file']) {
    assert.ok(labels.some((item) => item && String(item).includes(label)), `${label} missing from ${labels.join(' | ')}`)
  }
  assert.equal(dom.window.document.querySelector('ui-file-input-dropzone').getAttribute('aria-label'), 'Drop a log or parameter file')
  assert.equal(dom.window.document.querySelector('#nav').getAttribute('role'), 'listbox')
  assert.equal(dom.window.document.querySelector('#tiles').getAttribute('role'), 'grid')
  dom.window.close()
})

test('arrow keys move across the tile grid and Enter activates a tile', async () => {
  const dom = mount()
  await tick()
  const { document, KeyboardEvent } = dom.window
  const grid = document.querySelector('#tiles')
  const opened = []
  grid.addEventListener('activate', (event) => opened.push(event.detail))
  const first = grid.querySelector('[value="MAGFit"]')
  first.focus()
  first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }))
  await tick()
  assert.equal(document.activeElement.getAttribute('value'), 'FilterReview')
  document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
  await tick()
  const detail = opened.at(-1)
  assert.equal(detail && (detail.value || detail), 'FilterReview')
  dom.window.close()
})
