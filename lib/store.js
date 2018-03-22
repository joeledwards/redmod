module.exports = store

function store () {
  const r = require('ramda')
  const proto = require('./proto')
  const map = {}

  const wrongType = proto.error(
    'WRONGTYPE Operation against a key holding the wrong kind of value'
  )

  function wrongArgCount (cmd) {
    return proto.error(`ERR wrong number of arguments for '${cmd}' command`)
  }

  function del (key) {
    if (r.isNil(key)) { return wrongArgCount('del') }

    const record = map[key]

    if (r.isNil(record)) {
      return proto.integer(0)
    } else {
      delete map[key]
      return proto.integer(1)
    }
  }

  function get (key) {
    if (r.isNil(key)) { return wrongArgCount('get') }

    const record = map[key]

    return r.isNil(record)
      ? proto.nil()
      : record.type !== 'string'
        ? wrongType
        : proto.bulkString(record.value)
  }

  function hdel (key, field) {
    if (r.isNil(key) || r.isNil(field)) { return wrongArgCount('hdel') }

    const record = map[key]

    if (r.isNil(record)) {
      return proto.integer(0)
    } else if (record.type !== 'hash') {
      return wrongType
    } else if (r.isNil(record.value[field])) {
      return proto.integer(0)
    } else {
      delete record[field]
      record.length--
      if (record.length < 1)
        delete map[key]
      return proto.integer(1)
    }
  }

  function hget (key, field) {
    if (r.isNil(key) || r.isNil(field)) { return wrongArgCount('hget') }

    const record = map[key]
    const value = record ? record.value[field] : undefined

    return r.isNil(record)
      ? proto.nil()
      : record.type !== 'hash'
        ? wrongType
        : r.isNil(value)
          ? proto.nil()
          : proto.bulkString('' + value)
  }

  function hset (key, field, value) {
    if (r.isNil(key) || r.isNil(field) || r.isNil(value)) { return wrongArgCount('hset') }

    let record = map[key]
    let isNew = 0

    if (r.isNil(record)) {
      record = map[key] = {
        type: 'hash',
        length: 0,
        value: {}
      }
      isNew = 1
    } else if (record.type !== 'hash') {
      return wrongType
    }

    const hash = record.value

    if (r.isNil(hash[field])) {
      isNew = 1
    }

    hash[field] = value
    record.length++

    return proto.integer(isNew)
  }

  function hlen (key) {
    if (r.isNil(key)) { return wrongArgCount('hlen') }

    let record = map[key]

    if (r.isNil(record)) {
      return proto.integer(0)
    } else if (record.type !== 'hash') {
      return wrongType
    } else {
      return proto.integer(record.length)
    }
  }

  function keys (expr) {
    return proto.array(
      Object.keys(map).filter(key => !expr || key.match(expr))
    )
  }

  function set (key, value) {
    if (r.isNil(key) || r.isNil(value)) { return wrongArgCount('set') }

    map[key] = {
      type: 'string',
      value
    }

    return proto.ok()
  }

  return {
    del,
    get,
    hdel,
    hget,
    hlen,
    hset,
    keys,
    set,
    _keyCount: () => Object.keys(map).length
  }
}
