module.exports = runServer

function runServer (config) {
  require('log-a-log')()

  const net = require('net')
  const r = require('ramda')
  const {orange} = require('@buzuli/color')

  const {version} = require('../package')
  const greeting = require('./greeting')
  const proto = require('./proto')
  const store = require('./store')()

  const {
    bindPort,
    bindIp
  } = config

  const clients = {}
  let nextId = 0

  const server = net.createServer(socket => {
    const id = nextId++

    clients[id] = socket
    console.info(`Client ${id} connected.`)

    socket.on('close', () => {
      delete clients[id]
      console.info(`Client ${id} disconnected.`)
    })

    socket.on('data', buffer => {
      const args = proto.simplify(proto.parse(buffer))
      //console.log(`Args: ${args}`)
      const cmd = r.toLower(args[0])
      switch (cmd) {
        case 'command': return socket.write(command())
        case 'info': return socket.write(info())
        case 'set': return socket.write(store.set(args[1], args[2]))
        case 'get': return socket.write(store.get(args[1]))
        default: return socket.write(proto.error(`ERR Unknown command '${cmd}'`))
      }
    })

    socket.resume()
  })

  server.on('error', error => {
    console.error(`Server error:`, error)
    process.exit(1)
  })

  server.on('close', () => {
    console.info('Server halted.')
    process.exit(0)
  })

  server.listen(bindPort, bindIp, () => {
    greeting({
      pid: process.pid,
      ip: bindIp,
      port: bindPort,
      version
    })
  })

  const shutdown = () => {
    const sockets = Object.values(clients)
    if (sockets.length > 0) {
      console.log(`Terminating ${orange(sockets.length)} client connection(s)`)
      sockets.forEach(socket => socket.end())
    } else {
      console.log('No clients connected')
    }
    server.close()
  }

  signals(shutdown)

  function command () {
    const cmd = proto.array([
      ['get', 2, ['readonly'], 1, 1, 1],
      ['info', 1, ['readonly'], 1, 1, 1],
      ['set', 3, [], 1, 2, 1]
    ])
    return cmd
  }

  function info () {
    const serverInfo = proto.bulkString(`
# Server

# Clients

# Memory

# Persisentence

# Stats

# Replication

# CPU

# Cluster
cluster_enabled:0

# Keyspace
db0:keys=${store.keys().length},expires=0,avg_ttl=0
    `)

    return serverInfo
  }
}

function signals (shutdown) {
  // process.stdin.resume();

  process.on('SIGINT', () => {
    console.info('Received SIGINT.  Halting server...')
    shutdown()
  })

  process.on('SIGTERM', () => {
    console.info('Received SIGTERM.  Halting server...')
    shutdown()
  })
}
