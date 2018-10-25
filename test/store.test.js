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

function wrongArgCount (cmd) {
  return error(`ERR wrong number of arguments for '${cmd}' command`)
}

const notAnInt = error(
  'ERR value is not an integer or out of range'
)

const wrongType = error(
  'WRONGTYPE Operation against a key holding the wrong kind of value'
)

function strEq (t) {
  return (a, b) => t.equal(a.toString(), b.toString())
}

// Keys
tap.test('store.keys()', async t => {
  const s = store()
  const eq = strEq(t)
  eq(s.keys(), wrongArgCount('keys'))
  eq(s.keys('a', 'b'), wrongArgCount('keys'))
  s.set('foo', 'bar')
  s.set('bar', 'foo')
  eq(s.keys('.'), array(['foo', 'bar']))
  eq(s.keys('oo'), array(['foo']))
})

tap.test('store.exists()', async t => {
  const s = store()
  const eq = strEq(t)
  eq(s.exists(), wrongArgCount('exists'))
  s.set('foo', 'bar')
  s.set('bar', 'foo')
  eq(s.exists('rob'), integer(0))
  eq(s.exists('foo'), integer(1))
  eq(s.exists('bar'), integer(1))
  eq(s.exists('foo', 'bar'), integer(2))
})

tap.test('store.type()', async t => {
  const s = store()
  const eq = strEq(t)
  eq(s.type(), wrongArgCount('type'))
  eq(s.type('foo', 'bar'), wrongArgCount('type'))
  eq(s.type('foo'), bulkString('none'))
  s.set('foo', 'bar')
  eq(s.type('foo'), bulkString('string'))
  s.del('foo')
  s.hset('foo', 'bar', 'baz')
  eq(s.type('foo'), bulkString('hash'))
})

tap.test('store.rename()', async t => {
  const s = store()
  const eq = strEq(t)
  eq(s.rename(), wrongArgCount('rename'))
  eq(s.rename('foo'), wrongArgCount('rename'))
  eq(s.rename('foo', 'bar', 'baz'), wrongArgCount('rename'))
  eq(s.rename('foo', 'bar'), error('ERR no such key'))
  s.set('foo', 'biff')
  eq(s.rename('foo', 'bar'), ok())
  eq(s.rename('foo', 'bar'), error('ERR no such key'))
  eq(s.get('foo'), nil())
  eq(s.get('bar'), bulkString('biff'))
})

tap.test('store.renamenx()', async t => {
  const s = store()
  const eq = strEq(t)
  eq(s.renamenx(), wrongArgCount('renamenx'))
  eq(s.renamenx('foo'), wrongArgCount('renamenx'))
  eq(s.renamenx('foo', 'bar', 'baz'), wrongArgCount('renamenx'))
  eq(s.renamenx('foo', 'bar'), error('ERR no such key'))
  s.set('foo', 'biff')
  eq(s.renamenx('foo', 'bar'), integer(1))
  eq(s.get('foo'), nil())
  eq(s.get('bar'), bulkString('biff'))
  eq(s.renamenx('foo', 'bar'), error('ERR no such key'))
  s.set('foo', 'boff')
  eq(s.renamenx('foo', 'bar'), integer(0))
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

tap.test('store.unlink()', async t => {
  const s = store()
  const eq = strEq(t)
  eq(s.unlink(), wrongArgCount('unlink'))
  eq(s.unlink('foo'), integer(0))
  s.set('foo', 'bar')
  eq(s.unlink('foo'), integer(1))
  s.hset('foo', 'bar', 'ley')
  eq(s.unlink('foo'), integer(1))
  eq(s.unlink('foo'), integer(0))
})

tap.test('store.expire()', async t => {
  let at = -1
  let now = 0
  const s = store({
    nowFunc: () => now,
    customScheduler: {
      at: when => { at = when }
    }
  })
  const eq = strEq(t)
  eq(s.expire(), wrongArgCount('expire'))
  eq(s.expire('foo'), wrongArgCount('expire'))
  eq(s.expire('foo', 1, 1), wrongArgCount('expire'))
  eq(s.expire('foo', 1), integer(0))
  eq(at, -1)
  s.set('foo', 'bar')
  eq(s.expire('foo', 1), integer(1))
  eq(at, 1000)
  eq(s.expire('foo', 1), integer(1))
})

tap.test('store.expireat()', async t => {
  let at = -1
  let now = 0
  const s = store({
    nowFunc: () => now,
    customScheduler: {
      at: when => { at = when }
    }
  })
  const eq = strEq(t)
  eq(s.expireat(), wrongArgCount('expireat'))
  eq(s.expireat('foo'), wrongArgCount('expireat'))
  eq(s.expireat('foo', 1, 1), wrongArgCount('expireat'))
  eq(s.expireat('foo', 1), integer(0))
  eq(at, -1)
  s.set('foo', 'bar')
  eq(s.expireat('foo', 1), integer(1))
  eq(at, 1000)
  eq(s.expireat('foo', 1), integer(1))
})

tap.test('store.ttl()', async t => {
  let at = -1
  let now = 1000
  const s = store({
    nowFunc: () => now,
    customScheduler: {
      at: when => { at = when }
    }
  })
  const eq = strEq(t)
  eq(s.ttl(), wrongArgCount('ttl'))
  eq(s.ttl('foo', 'foo'), wrongArgCount('ttl'))
  eq(s.ttl('foo'), integer(-2))
  s.set('foo', 'bar')
  eq(s.ttl('foo'), integer(-1))
  s.expire('foo', 1)
  eq(at, 2000)
  eq(s.ttl('foo'), integer(1))
  s.expireat('foo', 2)
  eq(at, 2000)
  eq(s.ttl('foo'), integer(1))
})

tap.test('store.pttl()', async t => {
  let at = -1
  let now = 1000
  const s = store({
    nowFunc: () => now,
    customScheduler: {
      at: when => { at = when }
    }
  })
  const eq = strEq(t)
  eq(s.pttl(), wrongArgCount('pttl'))
  eq(s.pttl('foo', 'foo'), wrongArgCount('pttl'))
  eq(s.pttl('foo'), integer(-2))
  s.set('foo', 'bar')
  eq(s.pttl('foo'), integer(-1))
  s.pexpire('foo', 100)
  eq(at, 1100)
  eq(s.pttl('foo'), integer(100))
  s.pexpireat('foo', 2200)
  eq(at, 2200)
  eq(s.pttl('foo'), integer(1200))
})

tap.test('store.pexpire()', async t => {
  let at = -1
  let now = 0
  const s = store({
    nowFunc: () => now,
    customScheduler: {
      at: when => { at = when }
    }
  })
  const eq = strEq(t)
  eq(s.pexpire(), wrongArgCount('pexpire'))
  eq(s.pexpire('foo'), wrongArgCount('pexpire'))
  eq(s.pexpire('foo', 1, 1), wrongArgCount('pexpire'))
  eq(s.pexpire('foo', 1), integer(0))
  eq(at, -1)
  s.set('foo', 'bar')
  eq(s.pexpire('foo', 1), integer(1))
  eq(at, 1)
  eq(s.pexpire('foo', 1), integer(1))
})

tap.test('store.pexpireat()', async t => {
  let at = -1
  let now = 0
  const s = store({
    nowFunc: () => now,
    customScheduler: {
      at: when => { at = when }
    }
  })
  const eq = strEq(t)
  eq(s.pexpireat(), wrongArgCount('pexpireat'))
  eq(s.pexpireat('foo'), wrongArgCount('pexpireat'))
  eq(s.pexpireat('foo', 1, 1), wrongArgCount('pexpireat'))
  eq(s.pexpireat('foo', 1), integer(0))
  eq(at, -1)
  s.set('foo', 'bar')
  eq(s.pexpireat('foo', 1), integer(1))
  eq(at, 1)
  eq(s.pexpireat('foo', 1), integer(1))
})

tap.test('store.persist()', async t => {
  const s = store({ customScheduler: { at: () => {} } })
  const eq = strEq(t)
  eq(s.persist(), wrongArgCount('persist'))
  eq(s.persist('foo', 'bar'), wrongArgCount('persist'))
  eq(s.persist('foo'), integer(0))
  s.set('foo', 'bar')
  eq(s.persist('foo'), integer(0))
  s.expire('foo', 0)
  eq(s.persist('foo'), integer(1))
  eq(s.persist('foo'), integer(0))
})

// Strings
tap.test('store.set()', async t => {
  const s = store()
  const eq = strEq(t)
  eq(s.set(), wrongArgCount('set'))
  eq(s.set('foo'), wrongArgCount('set'))
  eq(s.set('foo', 'bar'), ok())
})

tap.test('store.setnx()', async t => {
  const s = store()
  const eq = strEq(t)
  eq(s.setnx(), wrongArgCount('setnx'))
  eq(s.setnx('foo'), wrongArgCount('setnx'))
  eq(s.setnx('foo', 'bar'), integer(1))
  eq(s.get('foo'), bulkString('bar'))
  eq(s.setnx('foo', 'baz'), integer(0))
  eq(s.get('foo'), bulkString('bar'))
  s.del('foo')
  s.hset('foo', 'bar', 'baz')
  eq(s.setnx('foo', 'biz'), integer(0))
  s.del('foo')
  eq(s.setnx('foo', 'buzz'), integer(1))
  eq(s.get('foo'), bulkString('buzz'))
})

tap.test('store.get()', async t => {
  const s = store()
  const eq = strEq(t)
  eq(s.get(), wrongArgCount('get'))
  eq(s.get('foo'), nil())
  s.set('foo', 'bar')
  eq(s.get('foo'), bulkString('bar'))
})

tap.test('store.getset()', async t => {
  const s = store()
  const eq = strEq(t)
  eq(s.getset(), wrongArgCount('getset'))
  eq(s.getset('foo'), wrongArgCount('getset'))
  eq(s.getset('foo', 'bar'), nil())
  eq(s.getset('foo', 'baz'), bulkString('bar'))
  s.del('foo')
  s.hset('foo', 'bar', 'baz')
  eq(s.getset('foo', 'biz'), wrongType)
})

tap.test('store.psetex()', async t => {
  let at = -1
  let now = 1000
  const s = store({
    nowFunc: () => now,
    customScheduler: {
      at: when => { at = when }
    }
  })
  const eq = strEq(t)
  eq(s.psetex('foo'), wrongArgCount('psetex'))
  eq(s.psetex('foo', 1), wrongArgCount('psetex'))
  eq(s.psetex('foo', 'bar', 'biz'), notAnInt)
  eq(s.get('foo'), nil())
  eq(s.psetex('foo', 1, 'bar'), ok())
  eq(at, 1001)
})

tap.test('store.setex()', async t => {
  let at = -1
  let now = 1000
  const s = store({
    nowFunc: () => now,
    customScheduler: {
      at: when => { at = when }
    }
  })
  const eq = strEq(t)
  eq(s.setex('foo'), wrongArgCount('setex'))
  eq(s.setex('foo', 1), wrongArgCount('setex'))
  eq(s.setex('foo', 'bar', 'biz'), notAnInt)
  eq(s.get('foo'), nil())
  eq(s.setex('foo', 1, 'bar'), ok())
  eq(at, 2000)
})

// Hashes
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

tap.test('store.hkeys()', async t => {
  const s = store()
  const eq = strEq(t)
  eq(s.hkeys(), wrongArgCount('hkeys'))
  eq(s.hkeys('foo'), array([]))
  s.hset('foo', 'a', '1')
  eq(s.hkeys('foo'), array(['a']))
  s.hset('foo', 'b', '1')
  eq(s.hkeys('foo'), array(['a', 'b']))
  s.hdel('foo', 'a')
  eq(s.hkeys('foo'), array(['b']))
  s.hdel('foo', 'b')
  eq(s.hkeys('foo'), array([]))
  s.set('foo', 'bar')
  eq(s.hkeys('foo'), wrongType)
})
