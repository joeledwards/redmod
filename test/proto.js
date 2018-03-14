const tap = require('tap')
const {
  simpleString,
  error,
  integer,
  bulkString,
  array
} = require('../lib/proto')

tap.test('proto.simpleString()', t => {
  t.equal(simpleString(null).toString(), '+\r\n')
  t.equal(simpleString('').toString(), '+\r\n')
  t.equal(simpleString('foo').toString(), '+foo\r\n')
  t.done()
})

tap.test('proto.error()', t => {
  t.equal(error(null).toString(), '-\r\n')
  t.equal(error('').toString(), '-\r\n')
  t.equal(error('A problem').toString(), '-A problem\r\n')
  t.done()
})

tap.test('proto.integer()', t => {
  t.equal(integer(0).toString(), ':0\r\n')
  t.equal(integer(-1).toString(), ':-1\r\n')
  t.equal(integer(1).toString(), ':1\r\n')
  t.equal(integer(-1.2).toString(), ':-1\r\n')
  t.equal(integer(1.2).toString(), ':1\r\n')
  t.done()
})

tap.test('proto.bulkString()', t => {
  t.equal(bulkString(null).toString(), '$-1\r\n')
  t.equal(bulkString('').toString(), '$0\r\n\r\n')
  t.equal(bulkString('foo').toString(), '$3\r\nfoo\r\n')
  t.done()
})

tap.test('proto.array()', t => {
  t.equal(array(null).toString(), '*-1\r\n')
  t.equal(array([]).toString(), '*0\r\n')
  t.equal(array([null]).toString(), '*1\r\n$-1\r\n')
  t.equal(array([13]).toString(), '*1\r\n:13\r\n')
  t.equal(array([1, 2]).toString(), '*2\r\n:1\r\n:2\r\n')
  t.equal(array(['foo']).toString(), '*1\r\n$3\r\nfoo\r\n')
  t.equal(array(['foo', 'bar']).toString(), '*2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n')
  t.equal(
    array([42, 'the answer']).toString(),
    '*2\r\n:42\r\n$10\r\nthe answer\r\n'
  )
  t.equal(
    array([['a', 'b'], [1, 2, 3]]).toString(),
    '*2\r\n*2\r\n$1\r\na\r\n$1\r\nb\r\n*3\r\n:1\r\n:2\r\n:3\r\n'
  )
  t.done()
})
