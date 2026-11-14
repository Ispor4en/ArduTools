const test = require('node:test')
const assert = require('node:assert/strict')
const { chooseTool, extensionOf, toolForPath } = require('../shared/routing')

const tools = [
  { id: 'MAGFit', href: '/MAGFit/', accept: ['.bin'] },
  { id: 'FilterReview', href: '/FilterReview/', accept: ['.bin'] },
  { id: 'HardwareReport', href: '/HardwareReport/', accept: ['.param', '.parm', '.bin'] },
  { id: 'FilterTool', href: '/FilterTool/', accept: ['.param', '.parm'] },
  { id: 'ThrustExpo', href: '/ThrustExpo/', accept: ['.param', '.parm', '.txt'] },
  { id: 'StreamStats', href: '/StreamStats/', accept: ['.bin', '.tlog'] },
  { id: 'AILogAnalyzer', href: '/AILogAnalyzer/', accept: ['.bin', '.log'] },
  { id: 'VideoOverlay', href: '/VideoOverlay/', accept: ['.bin'] },
  { id: 'KinematicTool', href: '/KinematicTool/', accept: [] },
  { id: 'KinematicToolPlane', href: '/KinematicTool/plane/', accept: [] },
]

test('extension is taken from the file name', () => {
  assert.equal(extensionOf('C:\\logs\\flight.BIN'), '.bin')
  assert.equal(extensionOf('copter.param'), '.param')
  assert.equal(extensionOf('README'), '')
})

test('a bin log opens in MAGFit unless a matching tool is already open', () => {
  assert.equal(chooseTool(tools, 'flight.bin', null).tool.id, 'MAGFit')
  assert.equal(chooseTool(tools, 'flight.bin', 'FilterReview').tool.id, 'FilterReview')
  assert.equal(chooseTool(tools, 'flight.bin', 'KinematicTool').tool.id, 'MAGFit')
})

test('parameter files prefer Hardware Report', () => {
  const choice = chooseTool(tools, 'quad.param', null)
  assert.equal(choice.tool.id, 'HardwareReport')
  assert.ok(choice.alternatives.some((tool) => tool.id === 'FilterTool'))
})

test('plane kinematic path wins over the parent tool', () => {
  assert.equal(toolForPath(tools, '/KinematicTool/plane/index.html').id, 'KinematicToolPlane')
  assert.equal(toolForPath(tools, '/KinematicTool/').id, 'KinematicTool')
})
