module.exports = store

function store () {
  const proto = require('./proto')
  const map = {}

  return {
    get: key => {
      const value = map[key]
      return value ? proto.bulkString(value) : proto.nil()
    },
    set: (key, value) => {
      map[key] = value
      return proto.ok()
    },
    keys: () => Object.keys(map)
  }
}
