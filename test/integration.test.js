const tap = require('tap')
const path = require('path')
const Redis = require('ioredis')
const { spawn } = require('child_process')

const bindPort = 17339
const redmodExecutable = path.resolve(__dirname, '..', 'bin', 'redmod.js')

testWithRedmod('ping behavior', async (assert, pub, sub) => {
  const messages = []
  const messagesFuture = {}
  messagesFuture.promise = new Promise(resolve => { messagesFuture.resolve = () => resolve() })
  sub.on('message', (channel, message) => {
    messages.push({ channel, message })
    if (messages.length === 2) {
      messagesFuture.resolve()
    }
  })

  assert.equals(await sub.subscribe('messages', 'notifications'), 2)
  assert.equals(await pub.ping(), 'PONG')
  assert.equals(await pub.ping('custom'), 'custom')
  assert.equals(await pub.publish('messages', 'howdy'), 1)
  assert.equals(await pub.publish('notifications', 'greeted'), 1)

  await messagesFuture.promise

  assert.same(messages, [
    { channel: 'messages', message: 'howdy' },
    { channel: 'notifications', message: 'greeted' }
  ])
})

// 1) fire up the redmod process
// 2) connect via ioredis
// 3) start tap test
// 4) invoke the asertions function | assertions: async (assert, pubClient, subClient) => Promise<nil>
// 5) tear down both cleanly
async function testWithRedmod (description, assertions) {
  tap.test(description, async assert => {
    let clients = []
    let proc
    try {
      await new Promise((resolve, reject) => {
        const stdoutBuffers = []
        const stderrBuffers = []

        proc = spawn(redmodExecutable, ['--bind-port', `${bindPort}`], { env: process.env })
        proc.stdout.on('data', data => stdoutBuffers.push(data))
        proc.stderr.on('data', data => stderrBuffers.push(data))
        proc.on('error', error => reject(error))
        proc.on('close', code => {
          if (code !== 0) {
            if (stderrBuffers.length) {
              console.info('=== STDERR ==========')
              console.info(Buffer.concat(stderrBuffers).toString())
            }
            if (stdoutBuffers.length) {
              console.info('=== STDOUT ==========')
              console.info(Buffer.concat(stdoutBuffers).toString())
            }
          }
        })

        const getClients = () => new Promise((resolve, reject) => {
          let readyCount = 0
          clients = [1, 2].map(() => new Redis({ host: 'localhost', port: bindPort }))
          clients.forEach(client => client.on('error', () => true))
          clients.forEach(client => client.on('connect', () => console.info('connected to redmod')))
          clients.forEach(client => client.on('ready', () => {
            readyCount++
            if (readyCount === 2) {
              const [pub, sub] = clients
              resolve({ pub, sub })
            }
          }))
        })

        getClients()
          .then(({ pub, sub }) => {
            return assertions(assert, pub, sub)
          })
          .then(() => {
            resolve()
          }, error => reject(error))
      })
    } finally {
      clients.forEach(client => {
        try {
          client.disconnect()
          client.removeAllListeners()
        } catch (error) {
          console.error('Disconnect failed')
        }
      })
      if (proc) {
        proc.kill('SIGTERM')
      }
    }
  })
}
