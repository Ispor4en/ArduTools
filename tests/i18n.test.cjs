const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'shell', 'tools.json'), 'utf8'))
const messages = JSON.parse(fs.readFileSync(path.join(root, 'shell', 'messages.json'), 'utf8'))
const phrases = JSON.parse(fs.readFileSync(path.join(root, 'shell', 'tool-phrases.json'), 'utf8'))

test('every shell string has English and Ukrainian', () => {
  for (const [key, value] of Object.entries(messages.shell)) {
    assert.ok(value.en && value.uk, key)
    if (value.en !== value.uk) assert.match(value.uk, /[А-Яа-яІіЇїЄєҐґ]/, key)
  }
})

test('every tool and group has a Ukrainian name and description', () => {
  for (const group of catalog.groups) {
    assert.equal(messages.groups[group.id].en, group.label, group.id)
    assert.match(messages.groups[group.id].uk, /[А-Яа-яІіЇїЄєҐґ]/)
  }
  for (const tool of catalog.tools) {
    const pack = messages.tools[tool.id]
    assert.ok(pack, tool.id)
    assert.equal(pack.name.en, tool.name)
    assert.equal(pack.description.en, tool.description)
    assert.match(pack.description.uk, /[А-Яа-яІіЇїЄєҐґ]/)
  }
})

test('tool label translations are Ukrainian and do not repeat the English key', () => {
  for (const [english, ukrainian] of Object.entries(phrases)) {
    assert.ok(ukrainian, english)
    if (/[A-Za-z]{4,}/.test(english) && !/^(AHRS|IOMCU|GPS|CPU|RC|FFT|IMU|PID|MAGFit)$/.test(english)) {
      assert.notEqual(ukrainian, english, english)
    }
  }
  assert.equal(phrases.Calculate, 'Обчислити')
  assert.equal(phrases['Open In'], 'Відкрити в')
})
