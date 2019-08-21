const tap = require('tap')
const pubsub = require('../lib/pubsub')

tap.test('pubsub.subscribe permits subscribing to multiple channels', async assert => {
  const ps = pubsub()
  assert.equals(ps.subscribe(1, 'a'), 1)
  assert.equals(ps.subscribe(1, 'b'), 2)
  assert.equals(ps.subscribe(1, 'b'), 2)
  assert.equals(ps.subscribe(1, 'c'), 3)
})

tap.test('pubsub.subscribe permits unsubscribing from channels', async assert => {
  const ps = pubsub()
  assert.equals(ps.subscribe(1, 'a'), 1)
  assert.equals(ps.subscribe(1, 'b'), 2)
  assert.equals(ps.subscribe(1, 'c'), 3)

  assert.equals(ps.unsubscribe(1, 'a'), 2)
  assert.equals(ps.unsubscribe(1, 'b'), 1)
  assert.equals(ps.unsubscribe(1, 'b'), 1)
  assert.equals(ps.unsubscribe(1, 'c'), 0)
})

tap.test('pubsub.unsubscribe permits unsubscribing a client from all channels simultaneously', async assert => {
  const ps = pubsub()

  assert.equals(ps.subscribe(1, 'a'), 1)
  assert.equals(ps.subscribe(1, 'b'), 2)
  assert.equals(ps.subscribe(1, 'c'), 3)
  assert.equals(ps.unsubscribe(1), 0)
})

tap.test('pubsub.publish triggers a message event', async assert => {
  const messages = []
  const ps = pubsub()
  ps.on('message', msg => messages.push(msg))

  assert.equals(ps.subscribe(1, 'a'), 1)
  ps.publish('a', 'A')
  ps.publish('a', 'A')
  assert.equals(ps.unsubscribe(1, 'a'), 0)
  ps.publish('a', 'A')

  assert.same(messages, [{ clientId: 1, channel: 'a', message: 'A' }, { clientId: 1, channel: 'a', message: 'A' }])
})

tap.test('pubsub.publish triggers a handler callback', async assert => {
  const messages = []
  const ps = pubsub(msg => messages.push(msg))

  assert.equals(ps.subscribe(1, 'a'), 1)
  ps.publish('a', 'A')
  ps.publish('a', 'A')
  assert.equals(ps.unsubscribe(1, 'a'), 0)
  ps.publish('a', 'A')

  assert.same(messages, [{ clientId: 1, channel: 'a', message: 'A' }, { clientId: 1, channel: 'a', message: 'A' }])
})

tap.test('pubsub.publish delivers to multiple client-ids', async assert => {
  const messages = []
  const ps = pubsub(msg => messages.push(msg))

  assert.equals(ps.subscribe(1, 'a'), 1)
  assert.equals(ps.subscribe(2, 'a'), 1)
  ps.publish('a', 'A')

  assert.same(messages, [{ clientId: 1, channel: 'a', message: 'A' }, { clientId: 2, channel: 'a', message: 'A' }])
})
