#!/usr/bin/env node

const server = require('../lib/server.js')
const config = require('yargs')
  .env('REDMOD')
  .option('bind-ip', {
    type: 'string',
    desc: 'IP address to which the server should bind',
    default: '0.0.0.0'
  })
  .option('bind-port', {
    type: 'number',
    desc: 'port to which the server should bind',
    default: 6379
  })
  .argv

server(config)
