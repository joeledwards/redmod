const tap = require('tap')
const store = require('../lib/store')
const {
  error,
  bulkString,
  integer,
  array,
  ok,
  nil
} = require('../lib/proto')

function wrongArgCount(cmd) {
  return error(`ERR wrong number of arguments for '${cmd}' command`)
}

const wrongType = error(
  'WRONGTYPE Operation against a key holding the wrong kind of value'
)

function strEq (t) {
  return (a, b) => t.equal(a.toString(), b.toString())
}

tap.test('store.set()', async t => {
  const s = store()
  const eq = strEq(t)
  eq(s.set(), wrongArgCount('set'))
  eq(s.set('foo'), wrongArgCount('set'))
  eq(s.set('foo', 'bar'), ok())
})

tap.test('store.get()', async t => {
  const s = store()
  const eq = strEq(t)
  eq(s.get(), wrongArgCount('get'))
  eq(s.get('foo'), nil())
  s.set('foo', 'bar')
  eq(s.get('foo'), bulkString('bar'))
})

tap.test('store.keys()', async t => {
  const s = store()
  const eq = strEq(t)
  eq(s.keys(), array([]))
  s.set('foo', 'bar')
  s.set('bar', 'foo')
  eq(s.keys(), array(['foo', 'bar']))
  eq(s.keys('oo'), array(['foo']))
})

tap.test('store.del()', async t => {
  const s = store()
  const eq = strEq(t)
  eq(s.del(), wrongArgCount('del'))
  eq(s.del('foo'), integer(0))
  s.set('foo', 'bar')
  eq(s.del('foo'), integer(1))
  s.hset('foo', 'bar', 'ley')
  eq(s.del('foo'), integer(1))
  eq(s.del('foo'), integer(0))
})

tap.test('store.hset()', async t => {
  const s = store()
  const eq = strEq(t)
  eq(s.hset(), wrongArgCount('hset'))
  eq(s.hset('foo'), wrongArgCount('hset'))
  eq(s.hset('foo', 'bar'), wrongArgCount('hset'))
  eq(s.hset('foo', 'bar', 'ley'), integer(1))
  eq(s.hget('foo', 'bar'), bulkString('ley'))
  eq(s.hset('foo', 'bar', 'soap'), integer(0))
  eq(s.hget('foo', 'bar'), bulkString('soap'))
})

tap.test('store.hget()', async t => {
  const s = store()
  const eq = strEq(t)
  eq(s.hget(), wrongArgCount('hget'))
  eq(s.hget('foo'), wrongArgCount('hget'))
  eq(s.hget('foo', 'bar'), nil())
  s.hset('foo', 'bar', 'ley')
  eq(s.hget('foo', 'bar'), bulkString('ley'))
  s.hset('foo', 'bar', 13)
  eq(s.hget('foo', 'bar'), bulkString('' + 13))
})

tap.test('store.hdel()', async t => {
  const s = store()
  const eq = strEq(t)
  eq(s.hdel(), wrongArgCount('hdel'))
  eq(s.hdel('foo'), wrongArgCount('hdel'))
  eq(s.hdel('foo', 'bar'), integer(0))
  s.hset('foo', 'bar', 'ley')
  eq(s.hget('foo', 'bar'), bulkString('ley'))
  eq(s.hdel('foo', 'bar'), integer(1))
  eq(s.hdel('foo', 'bar'), integer(0))
})

tap.test('store.hlen()', async t => {
  const s = store()
  const eq = strEq(t)
  eq(s.hlen(), wrongArgCount('hlen'))
  eq(s.hlen('foo'), integer(0))
  s.hset('foo', 'a', '1')
  eq(s.hlen('foo'), integer(1))
  s.hset('foo', 'b', '1')
  eq(s.hlen('foo'), integer(2))
  s.hdel('foo', 'a')
  eq(s.hlen('foo'), integer(1))
  s.hdel('foo', 'b')
  eq(s.hlen('foo'), integer(0))
  s.set('foo', 'bar')
  eq(s.hlen('foo'), wrongType)
})
