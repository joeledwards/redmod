module.exports = store

function store ({ customScheduler, nowFunc } = {}) {
  const r = require('ramda')
  const proto = require('./proto')
  const scheduler = require('@buzuli/scheduler')
  const map = new Map()
  const sched = customScheduler || scheduler()
  const now = nowFunc || (() => Date.now())

  const wrongType = proto.error(
    'WRONGTYPE Operation against a key holding the wrong kind of value'
  )

  const notAnInt = proto.error(
    'ERR value is not an integer or out of range'
  )

  function wrongArgCount (cmd) {
    return proto.error(`ERR wrong number of arguments for '${cmd}' command`)
  }

  // Delegate for all expire commands
  function expire (isDelay, isMillis, isText) {
    return (key, value) => {
      try {
        const record = map.get(key)
        if (record) {
          const offset = parseInt(value)
          const intervalDuration = isMillis ? offset : (offset * 1000)
          const delayDuration = now() + intervalDuration
          record.expireAt = isDelay ? delayDuration : intervalDuration
          sched.at(record.expireAt, () => {
            // Need to check since the expiration could be altered
            if (!r.isNil(record.expireAt) && record.expireAt <= now()) {
              map.delete(key)
            }
          })

          return isText ? proto.ok() : proto.integer(1)
        } else {
          return isText ? proto.ok() : proto.integer(0)
        }
      } catch (_error) {
        return notAnInt
      }
    }
  }

  // Delegate for ttl commands
  function ttl (isMillis) {
    return (key) => {
      const record = map.get(key)
      if (!record) {
        return proto.integer(-2)
      }
      if (r.isNil(record.expireAt)) {
        return proto.integer(-1)
      }
      const delay = record.expireAt - now()
      return proto.integer(isMillis ? delay : (delay / 1000))
    }
  }

  // Arg count enforcement and metadata enrichment for commands
  function command ({
    name,
    handler,
    flags = [],
    required = 0,
    optional = 0
  }) {
    const cmd = function () {
      const argCount = arguments.length
      if (argCount < required) {
        return wrongArgCount(name)
      }

      if (optional >= 0 && argCount > required + optional) {
        return wrongArgCount(name)
      }

      return handler(...arguments)
    }

    cmd.name = name
    cmd.flags = flags
    cmd.required = required
    cmd.optional = optional

    return { name, cmd }
  }

  // All commands
  const commands = [
    // keys
    command({
      name: 'keys',
      required: 1,
      flags: ['readonly', 'sort_for_script'],
      handler: expr => {
        return proto.array(
          Array.from(map.keys()).filter(key => {
            try {
              return !expr || key.match(expr)
            } catch (e) {
              return false
            }
          })
        )
      }
    }),

    // exists
    command({
      name: 'exists',
      required: 1,
      optional: -1,
      handler: function () {
        const keys = Object.values(arguments)
        return proto.integer(
          keys.reduce((acc, key) => acc + (map.has(key) ? 1 : 0), 0)
        )
      }
    }),

    // type
    command({
      name: 'type',
      required: 1,
      handler: function (key) {
        const record = map.get(key)
        if (r.isNil(record)) {
          return proto.bulkString('none')
        } else {
          return proto.bulkString(record.type)
        }
      }
    }),

    // rename
    command({
      name: 'rename',
      required: 2,
      handler: function (srcKey, dstKey) {
        const record = map.get(srcKey)
        if (r.isNil(record)) {
          return proto.error('ERR no such key')
        } else {
          map.delete(srcKey)
          map.set(dstKey, record)
          return proto.ok()
        }
      }
    }),

    // renamenx
    command({
      name: 'renamenx',
      required: 2,
      handler: function (srcKey, dstKey) {
        const record = map.get(srcKey)
        if (r.isNil(record)) {
          return proto.error('ERR no such key')
        } else if (map.has(dstKey)) {
          return proto.integer(0)
        } else {
          map.delete(srcKey)
          map.set(dstKey, record)
          return proto.integer(1)
        }
      }
    }),

    // del
    command({
      name: 'del',
      required: 1,
      optional: -1,
      handler: function () {
        const keys = Object.values(arguments)
        return proto.integer(
          keys.reduce((acc, key) => acc + (map.delete(key) ? 1 : 0), 0)
        )
      }
    }),

    // unlink
    command({
      name: 'unlink',
      required: 1,
      optional: -1,
      handler: function () {
        const keys = Object.values(arguments)
        return proto.integer(
          keys.reduce((acc, key) => acc + (map.delete(key) ? 1 : 0), 0)
        )
      }
    }),

    // expire
    command({
      name: 'expire',
      required: 2,
      handler: expire(true, false)
    }),

    // expireat
    command({
      name: 'expireat',
      required: 2,
      handler: expire(false, false)
    }),

    // ttl
    command({
      name: 'ttl',
      required: 1,
      handler: ttl(false)
    }),

    // pexpire
    command({
      name: 'pexpire',
      required: 2,
      handler: expire(true, true)
    }),

    // pexpireat
    command({
      name: 'pexpireat',
      required: 2,
      handler: expire(false, true)
    }),

    // pttl
    command({
      name: 'pttl',
      required: 1,
      handler: ttl(true)
    }),

    // persist
    command({
      name: 'persist',
      required: 1,
      handler: (key) => {
        const record = map.get(key)

        if (r.isNil(record)) {
          return proto.integer(0)
        } else if (r.isNil(record.expireAt)) {
          return proto.integer(0)
        } else {
          record.expireAt = undefined
          delete record.expireAt
          return proto.integer(1)
        }
      }
    }),

    // set
    command({
      name: 'set',
      required: 2,
      flags: ['write', 'denyoom'],
      handler: (key, value) => {
        map.set(key, {
          type: 'string',
          value
        })

        return proto.ok()
      }
    }),

    // setnx
    command({
      name: 'setnx',
      required: 2,
      flags: ['write', 'denyoom', 'fast'],
      handler: (key, value) => {
        const record = map.get(key)

        if (!r.isNil(record)) {
          return proto.integer(0)
        }

        map.set(key, {
          type: 'string',
          value
        })

        return proto.integer(1)
      }
    }),

    // psetex
    command({
      name: 'psetex',
      required: 3,
      flags: ['write', 'denyoom'],
      handler: (key, ttl, value) => {
        if (isNaN(ttl)) {
          return notAnInt
        }

        map.set(key, {
          type: 'string',
          value
        })

        return expire(true, true, true)(key, Number(ttl))
      }
    }),

    // setex
    command({
      name: 'setex',
      required: 3,
      flags: ['write', 'denyoom'],
      handler: (key, ttl, value) => {
        if (isNaN(ttl)) {
          return notAnInt
        }

        map.set(key, {
          type: 'string',
          value
        })

        return expire(true, false, true)(key, Number(ttl))
      }
    }),

    // get
    command({
      name: 'get',
      required: 1,
      flags: ['readonly', 'fast'],
      handler: (key) => {
        const record = map.get(key)

        return r.isNil(record)
          ? proto.nil()
          : record.type !== 'string'
            ? wrongType
            : proto.bulkString(record.value)
      }
    }),

    // getset
    command({
      name: 'getset',
      required: 2,
      flags: ['write', 'denyoom'],
      handler: (key, value) => {
        const record = map.get(key)
        let result = proto.nil()

        if (!r.isNil(record)) {
          if (record.type !== 'string') {
            return wrongType
          } else {
            result = proto.bulkString(record.value)
          }
        }

        map.set(key, {
          type: 'string',
          value
        })

        return result
      }
    }),

    // hset
    command({
      name: 'hset',
      required: 3,
      handler: (key, field, value) => {
        let record = map.get(key)
        let isNew = 0

        if (r.isNil(record)) {
          record = {
            type: 'hash',
            value: new Map()
          }
          map.set(key, record)
          isNew = 1
        } else if (record.type !== 'hash') {
          return wrongType
        }

        const hash = record.value

        if (!hash.has(field)) {
          isNew = 1
        }

        hash.set(field, value)

        return proto.integer(isNew)
      }
    }),

    // hsetnx
    command({
      name: 'hsetnx',
      required: 3,
      handler: (key, field, value) => {
        let record = map.get(key)
        let isNew = 0

        if (r.isNil(record)) {
          record = {
            type: 'hash',
            value: new Map()
          }
          map.set(key, record)
          isNew = 1
        } else if (record.type !== 'hash') {
          return wrongType
        }

        const hash = record.value

        if (!hash.has(field)) {
          hash.set(field, value)
          isNew = 1
        }

        return proto.integer(isNew)
      }
    }),

    // hget
    command({
      name: 'hget',
      required: 2,
      handler: (key, field) => {
        const record = map.get(key)
        const value = record ? record.value.get(field) : undefined

        if (r.isNil(record)) {
          return proto.nil()
        } else if (record.type !== 'hash') {
          return wrongType
        } else if (r.isNil(value)) {
          return proto.nil()
        } else {
          return proto.bulkString('' + value)
        }
      }
    }),

    // hdel
    command({
      name: 'hdel',
      required: 2,
      optional: -1,
      handler: function () {
        const [key, ...fields] = Object.values(arguments)

        const record = map.get(key)

        if (r.isNil(record)) {
          return proto.integer(0)
        } else if (record.type !== 'hash') {
          return wrongType
        } else {
          return proto.integer(
            fields.reduce((acc, field) => {
              if (record.value.delete(field)) {
                if (record.value.size < 1) {
                  map.delete(key)
                }
                return acc + 1
              } else {
                return acc
              }
            }, 0)
          )
        }
      }
    }),

    // hlen
    command({
      name: 'hlen',
      required: 1,
      handler: key => {
        const record = map.get(key)

        if (r.isNil(record)) {
          return proto.integer(0)
        } else if (record.type !== 'hash') {
          return wrongType
        } else {
          return proto.integer(record.value.size)
        }
      }
    }),

    // hkeys
    command({
      name: 'hkeys',
      required: '1',
      handler: key => {
        const record = map.get(key)

        if (r.isNil(record)) {
          return proto.array([])
        } else if (record.type !== 'hash') {
          return wrongType
        } else {
          return proto.array(Array.from(record.value.keys()))
        }
      }
    }),

    // hexists
    command({
      name: 'hexists',
      required: '2',
      handler: (key, field) => {
        const record = map.get(key)

        if (r.isNil(record)) {
          return proto.integer(0)
        } else if (record.type !== 'hash') {
          return wrongType
        } else if (r.isNil(record.value.get(field))) {
          return proto.integer(0)
        } else {
          return proto.integer(1)
        }
      }
    }),

    // hgetall
    command({
      name: 'hgetall',
      required: '1',
      handler: key => {
        const record = map.get(key)

        if (r.isNil(record)) {
          return proto.array([])
        } else if (record.type !== 'hash') {
          return wrongType
        } else {
          const array = []
          for (const [k, v] of record.value) {
            array.push(k)
            array.push(v)
          }
          return proto.array(array)
        }
      }
    }),

    {
      name: '_keyCount',
      cmd: () => map.size
    },

    {
      name: '_commandList',
      cmd: ({ sorted }) => {
        const cmds = commands.map(({ name }) => name).filter(v => v[0] !== '_')
        if (sorted) {
          cmds.sort()
        }
        return cmds.join('\n')
      }
    }
  ]

  // Export all commands
  return r.compose(
    r.fromPairs,
    r.map(({ name, cmd }) => [name, cmd])
  )(commands)
}
