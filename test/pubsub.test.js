const tap = require('tap')
const pubsub = require('../lib/pubsub')

tap.test('pubsub.subscribe permits subscribing to multiple channels', async assert => {
  const {
    ps,
    messages,
    publishes,
    subscribes,
    unsubscribes
  } = newPubsub()

  assert.equals(ps.subscribe(1, 'a'), 1)
  assert.equals(ps.subscribe(1, 'b'), 2)
  assert.equals(ps.subscribe(1, 'b'), 2)
  assert.equals(ps.subscribe(1, 'c'), 3)

  assert.same(messages, [])
  assert.same(publishes, [])
  assert.same(subscribes, [
    { clientId: 1, channel: 'a', count: 1 },
    { clientId: 1, channel: 'b', count: 2 },
    { clientId: 1, channel: 'b', count: 2 },
    { clientId: 1, channel: 'c', count: 3 }
  ])
  assert.same(unsubscribes, [])
})

tap.test('pubsub.subscribe permits unsubscribing from channels', async assert => {
  const {
    ps,
    messages,
    publishes,
    subscribes,
    unsubscribes
  } = newPubsub()

  assert.equals(ps.subscribe(1, 'a'), 1)
  assert.equals(ps.subscribe(1, 'b'), 2)
  assert.equals(ps.subscribe(1, 'c'), 3)

  assert.equals(ps.unsubscribe(1, 'a'), 2)
  assert.equals(ps.unsubscribe(1, 'b'), 1)
  assert.equals(ps.unsubscribe(1, 'b'), 1)
  assert.equals(ps.unsubscribe(1, 'c'), 0)

  assert.same(messages, [])
  assert.same(publishes, [])
  assert.same(subscribes, [
    { clientId: 1, channel: 'a', count: 1 },
    { clientId: 1, channel: 'b', count: 2 },
    { clientId: 1, channel: 'c', count: 3 }
  ])
  assert.same(unsubscribes, [
    { clientId: 1, channel: 'a', count: 2 },
    { clientId: 1, channel: 'b', count: 1 },
    { clientId: 1, channel: 'b', count: 1 },
    { clientId: 1, channel: 'c', count: 0 }
  ])
})

tap.test('pubsub.unsubscribe permits unsubscribing a client from all channels simultaneously', async assert => {
  const {
    ps,
    messages,
    publishes,
    subscribes,
    unsubscribes
  } = newPubsub()

  assert.equals(ps.subscribe(1, 'a'), 1)
  assert.equals(ps.subscribe(1, 'b'), 2)
  assert.equals(ps.subscribe(1, 'c'), 3)
  assert.equals(ps.unsubscribe(1), 0)

  assert.same(messages, [])
  assert.same(publishes, [])
  assert.same(subscribes, [
    { clientId: 1, channel: 'a', count: 1 },
    { clientId: 1, channel: 'b', count: 2 },
    { clientId: 1, channel: 'c', count: 3 }
  ])
  assert.same(unsubscribes, [
    { clientId: 1, channel: 'a', count: 2 },
    { clientId: 1, channel: 'b', count: 1 },
    { clientId: 1, channel: 'c', count: 0 }
  ])
})

tap.test('pubsub.publish triggers a message event', async assert => {
  const {
    ps,
    messages,
    publishes,
    subscribes,
    unsubscribes
  } = newPubsub()

  assert.equals(ps.subscribe(1, 'a'), 1)
  assert.equals(ps.publish(0, 'a', 'A'), 1)
  assert.equals(ps.publish(1, 'a', 'A'), 1)
  assert.equals(ps.unsubscribe(1, 'a'), 0)
  assert.equals(ps.publish(2, 'a', 'A'), 0)

  assert.same(messages, [
    { clientId: 1, channel: 'a', message: 'A' },
    { clientId: 1, channel: 'a', message: 'A' }
  ])
  assert.same(publishes, [
    { clientId: 0, channel: 'a', count: 1 },
    { clientId: 1, channel: 'a', count: 1 },
    { clientId: 2, channel: 'a', count: 0 }
  ])
  assert.same(subscribes, [
    { clientId: 1, channel: 'a', count: 1 }
  ])
  assert.same(unsubscribes, [
    { clientId: 1, channel: 'a', count: 0 }
  ])
})

tap.test('pubsub.publish delivers to multiple client-ids', async assert => {
  const {
    ps,
    messages,
    publishes,
    subscribes,
    unsubscribes
  } = newPubsub()

  assert.equals(ps.subscribe(1, 'a'), 1)
  assert.equals(ps.subscribe(2, 'a'), 1)
  assert.equals(ps.publish(0, 'a', 'A'), 2)

  assert.same(messages, [
    { clientId: 1, channel: 'a', message: 'A' },
    { clientId: 2, channel: 'a', message: 'A' }
  ])
  assert.same(publishes, [
    { clientId: 0, channel: 'a', count: 2 }
  ])
  assert.same(subscribes, [
    { clientId: 1, channel: 'a', count: 1 },
    { clientId: 2, channel: 'a', count: 1 }
  ])
  assert.same(unsubscribes, [])
})

function newPubsub () {
  const ps = pubsub()
  const messages = []
  const publishes = []
  const subscribes = []
  const unsubscribes = []

  ps.on('message', r => messages.push(r))
  ps.on('publish', r => publishes.push(r))
  ps.on('subscribe', r => subscribes.push(r))
  ps.on('unsubscribe', r => unsubscribes.push(r))

  return {
    ps,
    messages,
    publishes,
    subscribes,
    unsubscribes
  }
}
