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

tap.test('store.set()', async t => {
  const wrongArgCount = "ERR wrong number of arguments for 'set' command"
  const s = store()
  t.equal(s.set().toString(), error(wrongArgCount).toString())
  t.equal(s.set('foo').toString(), error(wrongArgCount).toString())
  t.equal(s.set('foo', 'bar').toString(), ok().toString())
})

tap.test('store.get()', async t => {
  const s = store()
  t.equal(s.get('foo').toString(), nil().toString())
  s.set('foo', 'bar')
  t.equal(s.get('foo').toString(), bulkString('bar').toString())
})

tap.test('store.keys()', async t => {
  const s = store()
  t.equal(s.keys().toString(), array([]).toString())
  s.set('foo', 'bar')
  s.set('bar', 'foo')
  t.equal(s.keys().toString(), array(['foo', 'bar']).toString())
  t.equal(s.keys('oo').toString(), array(['foo']).toString())
})

tap.test('store.del()', async t => {
  const s = store()
  t.equals(s.del('foo').toString(), integer(0).toString())
  s.set('foo', 'bar')
  t.equals(s.del('foo').toString(), integer(1).toString())
  s.hset('foo', 'bar', 'ley')
  t.equals(s.del('foo').toString(), integer(1).toString())
  t.equals(s.del('foo').toString(), integer(0).toString())
})
