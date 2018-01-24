#!/usr/bin/env node

const redmod = require('../lib/index.js')
const config = require('yargs')
  .env('REDMOD')
  .option('bind-ip', {
    type: 'string',
    desc: 'ip to which the server should bind',
    default: '0.0.0.0'
  })
  .option('bind-port', {
    type: 'number',
    desc: 'port to which the server should bind',
    default: 6379
  })
  .argv

redmod(config)
