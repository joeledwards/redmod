module.exports = store

function store () {
  const proto = require('./proto')
  const map = {}

  return {
    get: key => {
      if (!key)
        return proto.error(`ERR wrong number of arguments for 'get' command`)
      const value = map[key]
      return value ? proto.bulkString(value) : proto.nil()
    },
    set: (key, value) => {
      if (!key || !value)
        return proto.error(`ERR wrong number of arguments for 'set' command`)
      map[key] = value
      return proto.ok()
    },
    keys: expr => Object.keys(map).filter(key => !expr || key.match(expr))
  }
}
