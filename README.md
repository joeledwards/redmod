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
$ redmod
[2018-05-03T08:00:16.309Z]|INFO>  Started server...
                _._
           _.-''   ''-._
      _.-''     _____   ''-._           redmod 2.6.1
  .-''        //     \\      ''-._
 (           //       \\          )      PID: 42953
 |'-._       \\       //      _.-'|       IP: 0.0.0.0
 |    '-._    \\_____//   _.-'    |     Port: 6379
  '-._    '-._        _.-'    _.-'
 |'-._'-._    '-.__.-'    _.-'_.-'|
 |    '-._'-._        _.-'_.-'    |     https://npmjs.com/package/redmod
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

[travis-url]: https://travis-ci.org/joeledwards/redmod
[travis-image]: https://img.shields.io/travis/joeledwards/redmod/master.svg
[npm-url]: https://www.npmjs.com/package/redmod
[npm-image]: https://img.shields.io/npm/v/redmod.svg
