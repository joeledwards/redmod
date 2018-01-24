module.exports = runServer

function runServer (config) {
	require('log-a-log')()

	const net = require('net')

	const greeting = require('./greeting')
	const {version} = require('../package')
	const {
		bindPort,
		bindIp
	} = config

	let nextId = 0
	const server = net.createServer(connection => {
		const id = nextId++

		connection.on('close', () => {
			// TODO: Remove client from tracking map
			console.info(`Client ${id} disconnected.`)
		})

		console.info(`Client ${id} connected.`)
		// TODO: add client to tracking map
	})

	server.on('error', error => {
		console.error(`Server error:`, error)
		process.exit(1)
	})

	server.listen(bindPort, bindIp, () => {
		greeting({
			pid: process.pid,
      ip: bindIp,
			port: bindPort,
			version
		})
	})
}
