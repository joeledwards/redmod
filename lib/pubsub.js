module.exports = pubsub

const EventEmitter = require('events')

function pubsub (handler) {
  const events = new EventEmitter()
  const clientChannelMap = new Map()
  const channelClientMap = new Map()
  // const clientPatternMap = new Map()
  // const patternClientMap = new Map()

  function publish (channel, message) {
    const idSet = channelClientMap.get(channel)
    if (idSet) {
      for (const clientId of idSet) {
        if (handler) {
          handler({ clientId, channel, message })
        }
        events.emit('message', { clientId, channel, message })
      }
    }
  }

  function subscribe (clientId, ...channels) {
    let channelSet = clientChannelMap.get(clientId)

    if (!channelSet) {
      channelSet = new Set()
      clientChannelMap.set(clientId, channelSet)
    }

    for (const channel of channels) {
      let idSet = channelClientMap.get(channel)
      if (!idSet) {
        idSet = new Set()
        channelClientMap.set(channel, idSet)
      }
      idSet.add(clientId)
      channelSet.add(channel)
    }

    return channelSet.size
  }

  function unsubscribe (clientId, ...channels) {
    const channelSet = clientChannelMap.get(clientId)

    if (channels.length < 1) {
      channels = channelSet.values()
    }

    for (const channel of channels) {
      if (channelSet) {
        channelSet.delete(channel)
      }
      const clientSet = channelClientMap.get(channel)
      if (clientSet) {
        clientSet.delete(clientId)
        if (clientSet.size < 1) {
          channelClientMap.delete(channel)
        }
      }
    }

    if (channelSet.size < 1) {
      clientChannelMap.delete(clientId)
    }

    return channelSet.size
  }

  events.publish = publish
  events.subscribe = subscribe
  events.unsubscribe = unsubscribe

  return events
}
