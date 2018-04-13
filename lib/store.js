module.exports = store

function store () {
  const r = require('ramda')
  const proto = require('./proto')
  const map = new Map()

  const wrongType = proto.error(
    'WRONGTYPE Operation against a key holding the wrong kind of value'
  )

  function wrongArgCount (cmd) {
    return proto.error(`ERR wrong number of arguments for '${cmd}' command`)
  }

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
