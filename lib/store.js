module.exports = store

function store ({customScheduler, nowFunc} = {}) {
  const r = require('ramda')
  const proto = require('./proto')
  const scheduler = require('@buzuli/scheduler')
  const map = new Map()
  const sched = customScheduler || scheduler()
  const now = nowFunc || (() => Date.now())

  const wrongType = proto.error(
    'WRONGTYPE Operation against a key holding the wrong kind of value'
  )

  function wrongArgCount (cmd) {
    return proto.error(`ERR wrong number of arguments for '${cmd}' command`)
  }

  // Delegate for all expire commands
  function expire (isDelay, isMillis) {
    return (key, value) => {
      try {
        const record = map.get(key)
        if (record) {
          const offset = parseInt(value)
          record.expireAt = isDelay ? (
            now() + (isMillis ? offset : offset * 1000)
          ) : (isMillis ? offset : offset * 1000)
          sched.at(record.expireAt, () => {
            // Need to check since the expiration could be altered
            if (!r.isNil(record.expireAt) && record.expireAt <= now()) {
              map.delete(key)
            }
          })
          return proto.integer(1)
        } else {
          return proto.integer(0)
        }
      } catch (_error) {
        return proto.error('ERR value is not an integer or out of range')
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

    return {name, cmd}
  }

  // All commands
  const commands = [
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
        let record = map.get(key)

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

    // hget
    command({
      name: 'hget',
      required: 2,
      handler: (key, field) => {
        const record = map.get(key)
        const value = record ? record.value.get(field) : undefined

        return r.isNil(record)
          ? proto.nil()
          : record.type !== 'hash'
            ? wrongType
            : r.isNil(value)
              ? proto.nil()
              : proto.bulkString('' + value)
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
        let record = map.get(key)

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
        let record = map.get(key)

        if (r.isNil(record)) {
          return proto.array([])
        } else if (record.type !== 'hash') {
          return wrongType
        } else {
          return proto.array(Array.from(record.value.keys()))
        }
      }
    }),

    {
      name: '_keyCount',
      cmd: () => map.size
    }
  ]

  // Export all commands
  return r.compose(
    r.fromPairs,
    r.map(({name, cmd}) => [name, cmd])
  )(commands)
}
