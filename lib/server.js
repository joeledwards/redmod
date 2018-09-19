module.exports = runServer

function runServer (config) {
  const {
    bindPort,
    bindIp,
    brightenMyDay
  } = config

  require('log-a-log')({
    mode: brightenMyDay ? 'pony' : 'coded'
  })

  const durations = require('durations')
  const net = require('net')
  const r = require('ramda')
  const os = require('os')
  const { orange } = require('@buzuli/color')

  const { version } = require('../package')
  const greeting = require('./greeting')
  const proto = require('./proto')
  const store = require('./store')()

  const uptimeWatch = durations.stopwatch().start()
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
      const argv = proto.simplify(proto.parse(buffer))
      const cmd = r.toLower(r.head(argv))
      const args = r.tail(argv)
      if (cmd === 'command') {
        return socket.write(command())
      } else if (cmd === 'info') {
        return socket.write(info())
      } else if (store[cmd]) {
        return socket.write(store[cmd](...args))
      } else {
        return socket.write(proto.error(`ERR Unknown command '${cmd}'`))
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
    /* TODO: pull command listing from store commands
    const cmd = r.compose(
      r.map(({name, count, flags}) => [name, count, flags])
      r.filter(x => r.startsWith('_', x.name))
    )(Object.values(store))
    */
    const cmd = proto.array([
      ['get', 2, ['readonly', 'fast'], 1, 1, 1],
      ['info', 1, ['loading', 'stale'], 0, 0, 0],
      ['keys', 2, ['readonly', 'sort_for_script'], 0, 0, 0],
      ['set', -3, ['write', 'denyoom'], 1, 1, 1]
    ])
    return cmd
  }

  function info () {
    const serverInfo = proto.bulkString(`
# Server
redmod_version:${version}
redmod_mode:standalone
os:${os.platform()} ${os.release()} ${os.arch()}
process_id:${process.pid}
tcp_port:${bindPort}
uptime_in_seconds:${uptimeWatch.duration().seconds().toFixed(0)}
uptime_in_days:${uptimeWatch.duration().days().toFixed(0)}

# Clients
connected_clients:${Object.keys(clients).length}

# Memory

# Persisentence
loading:0

# Stats

# Replication
role:master

# CPU

# Cluster
cluster_enabled:0

# Keyspace
db0:keys=${store._keyCount()},expires=0,avg_ttl=0
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
