# redmod

[![Build Status][travis-image]][travis-url]
[![NPM version][npm-image]][npm-url]

A partial implementaion of Redis.

## Installation

```shell
$ npm install -g redmod
```

## Running

```shell
[2019-08-25T23:34:21.611Z]INFO>  Started server...
                _._
           _.-''   ''-._
      _.-''     _____   ''-._           redmod 2.14.0
  .-''        //     \\      ''-._
 (           //       \\          )      PID: 14190
 |'-._       \\       //      _.-'|       IP: 0.0.0.0
 |    '-._    \\_____//   _.-'    |     Port: 6379
  '-._    '-._        _.-'    _.-'
 |'-._'-._    '-.__.-'    _.-'_.-'|
 |    '-._'-._        _.-'_.-'    |     https://npmjs.com/redmod
  '-._    '-._'-.__.-'_.-'    _.-'
 |'-._'-._    '-.__.-'    _.-'_.-'|
 |    '-._'-._        _.-'_.-'    |
  '-._    '-._'-.__.-'_.-'    _.-'
      '-._    '-.__.-'    _.-'
          '-._        _.-'
              '-.__.-'
```

## Options

```shell
$ redmon --help
Options:
  --help                 Show help                                     [boolean]
  --version              Show version number                           [boolean]
  --bind-ip, -i          IP address to which the server should bind
                                                   [string] [default: "0.0.0.0"]
  --bind-port, -p        port to which the server should bind
                                                        [number] [default: 6379]
  --brighten-my-day, -B  brighten my day              [boolean] [default: false]
  --commands, -c         list all commands and exit                    [boolean]
  --commands-sorted, -C  list all commands sorted by name and exit     [boolean]
```

## Supported Redis Features & Commands

### Connection and Health
- info (partial)
- ping
- quit

### Keys
- del
- exists
- expire
- expireat
- keys
- persist
- pexpire
- pexpireat
- pttl
- rename
- renamenx
- ttl
- type
- unlink

### Strings
- get
- getset
- psetex
- set
- setex
- setnx

### Hashes
- hdel
- hexists
- hget
- hkeys
- hlen
- hset

### Pub/Sub
- publish
- subscribe
- unsubscribe

## Roadmap: Planned Redis Features and Commands

### Hashes
- hgetall
- hmget
- hmset
- hsetnx
- hstrlen
- hvals
- hincrby
- hincrbyfloat

### Lists
- lpush
- lpop
- lpushx
- rpush
- rpop
- rpushx
- rpoplpush
- llen
- lindex
- lrem
- lset
- linsert
- lrange
- ltrim
- blpop
- brpop
- brpoplpush

### Sets
- sadd
- srem
- spop
- scard 
- smembers
- sismember
- srandmember
- smove
- sdiff
- sdiffstore
- sinter
- sinterstore
- sunion
- sunionstore

### Scanning
- scan
- hscan
- sscan

[travis-url]: https://travis-ci.org/joeledwards/redmod
[travis-image]: https://img.shields.io/travis/joeledwards/redmod/master.svg
[npm-url]: https://www.npmjs.com/package/redmod
[npm-image]: https://img.shields.io/npm/v/redmod.svg
