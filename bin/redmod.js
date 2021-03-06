#!/usr/bin/env node

const server = require('../lib/server.js')
const config = require('yargs')
  .env('REDMOD')
  .option('bind-ip', {
    type: 'string',
    desc: 'IP address to which the server should bind',
    default: '0.0.0.0',
    alias: ['i']
  })
  .option('bind-port', {
    type: 'number',
    desc: 'port to which the server should bind',
    default: 6379,
    alias: ['p']
  })
  .option('brighten-my-day', {
    type: 'boolean',
    desc: 'brighten my day',
    default: false,
    alias: ['B']
  })
  .option('commands', {
    type: 'boolean',
    desc: 'list all commands and exit',
    alias: ['c']
  })
  .option('commands-sorted', {
    type: 'boolean',
    desc: 'list all commands sorted by name and exit',
    alias: ['C']
  })
  .argv

if (config.c || config.C) {
  console.log(require('../lib/store')()._commandList({ sorted: config.C }))
} else {
  server(config)
}
