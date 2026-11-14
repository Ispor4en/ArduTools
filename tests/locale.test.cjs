const test = require('node:test')
const assert = require('node:assert/strict')
const { langFromLocale } = require('../shared/locale')

test('a saved choice wins over the system locale', () => {
  assert.equal(langFromLocale('en-US', 'uk'), 'uk')
  assert.equal(langFromLocale('uk-UA', 'en'), 'en')
})

test('Ukrainian Windows locales default to Ukrainian', () => {
  assert.equal(langFromLocale('uk'), 'uk')
  assert.equal(langFromLocale('uk-UA'), 'uk')
  assert.equal(langFromLocale('UK'), 'uk')
})

test('other locales default to English', () => {
  assert.equal(langFromLocale('en-US'), 'en')
  assert.equal(langFromLocale('de-DE'), 'en')
  assert.equal(langFromLocale(''), 'en')
})
