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

  function command ({
    name,
    handler,
    required = 0,
    optional = 0
  }) {
    return {
      name,
      action: function () {
        const argCount = arguments.length
        if (argCount < required) {
          return wrongArgCount(name)
        }

        if (optional >= 0 && argCount > required + optional) {
          return wrongArgCount(name)
        }

        return handler(...arguments)
      }
    }
  }

  const commands = [
    // set
    command({
      name: 'set',
      required: 2,
      flags: ['write', 'denyoom'],
      handler: (key, value) => {
        map[key] = {
          type: 'string',
          value
        }

        return proto.ok()
      }
    }),

    // get
    command({
      name: 'get',
      required: 1,
      flags: ['readonly', 'fast'],
      handler: (key) => {
        const record = map[key]

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
        let deleteCount = 0

        keys.forEach(key => {
          const record = map[key]

          if (!r.isNil(record)) {
            delete map[key]
            deleteCount++
          }
        })

        return proto.integer(deleteCount)
      }
    }),

    // keys
    command({
      name: 'keys',
      required: 1,
      flags: ['readonly', 'sort_for_script'],
      handler: expr => {
        return proto.array(
          Object.keys(map).filter(key => {
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
        let keyCount = 0

        keys.forEach(key => {
          const record = map[key]

          if (!r.isNil(record)) {
            keyCount++
          }
        })

        return proto.integer(keyCount)
      }
    }),

    // hset
    command({
      name: 'hset',
      required: 3,
      handler: (key, field, value) => {
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
          record.length++
        }

        hash[field] = value

        return proto.integer(isNew)
      }
    }),

    // hget
    command({
      name: 'hget',
      required: 2,
      handler: (key, field) => {
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
    }),

    // hdel
    command({
      name: 'hdel',
      required: 2,
      optional: -1,
      handler: function () {
        const [key, ...fields] = Object.values(arguments)

        const record = map[key]

        if (r.isNil(record)) {
          return proto.integer(0)
        } else if (record.type !== 'hash') {
          return wrongType
        } else {
          let deleteCount = 0

          fields.forEach(field => {
            if (!r.isNil(record.value[field])) {
              delete record[field]
              record.length--
              if (record.length < 1)
                delete map[key]
              deleteCount++
            }
          })

          return proto.integer(deleteCount)
        }
      }
    }),

    // hlen
    command({
      name: 'hlen',
      required: 1,
      handler: key => {
        let record = map[key]

        if (r.isNil(record)) {
          return proto.integer(0)
        } else if (record.type !== 'hash') {
          return wrongType
        } else {
          return proto.integer(record.length)
        }
      }
    }),

    // hkeys
    command({
      name: 'hkeys',
      required: '1',
      handler: key => {
        let record = map[key]

        if (r.isNil(record)) {
          return proto.array([])
        } else if (record.type !== 'hash') {
          return wrongType
        } else {
          return proto.array(Object.keys(record.value))
        }
      }
    }),

    {
      name: '_keyCount',
      action: () => Object.keys(map).length
    }
  ]

  // Export all commands
  return r.compose(
    r.fromPairs,
    r.map(({name, action}) => [name, {name, handler: action}])
  )(commands)
}
