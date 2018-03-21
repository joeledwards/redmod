const tap = require('tap')
const {
  simpleString,
  error,
  integer,
  bulkString,
  array,
  parse,
  simplify,
  ok,
  nil,
  readSimpleString,
  readError,
  readInteger,
  readBulkString,
  readArray
} = require('../lib/proto')

const json = obj => JSON.stringify(obj)

tap.test('proto.simplify()', async t => {
  t.equal(json(simplify(parse(simpleString('foobar')))), json(['foobar']))
})

tap.test('proto.ok()', async t => {
  t.equal(ok().toString(), '+OK\r\n')
})

tap.test('proto.nil()', async t => {
  t.equal(nil().toString(), '$-1\r\n')
})

tap.test('proto.simpleString()', async t => {
  t.equal(simpleString(null).toString(), '+\r\n')
  t.equal(simpleString('').toString(), '+\r\n')
  t.equal(simpleString('foo').toString(), '+foo\r\n')
})

tap.test('proto.error()', async t => {
  t.equal(error(null).toString(), '-\r\n')
  t.equal(error('').toString(), '-\r\n')
  t.equal(error('A problem').toString(), '-A problem\r\n')
})

tap.test('proto.integer()', async t => {
  t.equal(integer(0).toString(), ':0\r\n')
  t.equal(integer(-1).toString(), ':-1\r\n')
  t.equal(integer(1).toString(), ':1\r\n')
  t.equal(integer(-1.2).toString(), ':-1\r\n')
  t.equal(integer(1.2).toString(), ':1\r\n')
})

tap.test('proto.bulkString()', async t => {
  t.equal(bulkString(null).toString(), '$-1\r\n')
  t.equal(bulkString('').toString(), '$0\r\n\r\n')
  t.equal(bulkString('foo').toString(), '$3\r\nfoo\r\n')
})

tap.test('proto.array()', async t => {
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
})

tap.test('proto.parse()', async t => {
  {
    const buffer = array([1, -2, ['alpha', 'beta']])
    const {type, value} = parse(buffer)
    t.equal(type, 'arr')
    t.equal(json(value), json([
      {
        type: 'int',
        value: 1
      },
      {
        type: 'int',
        value: -2
      },
      {
        type: 'arr',
        value: [
          {
            type: 'blk',
            value: 'alpha'
          },
          {
            type: 'blk',
            value: 'beta'
          }
        ]
      }
    ]))
  }
})

tap.test('proto.readSimpleString()', async t => {
  {
    const buffer = error(null)
    const [{type, value}, offset] = readSimpleString(buffer, 1)
    t.equal(offset, buffer.length)
    t.equal(type, 'str')
    t.equal(value, '')
  }
  {
    const buffer = error('')
    const [{type, value}, offset] = readSimpleString(buffer, 1)
    t.equal(offset, buffer.length)
    t.equal(type, 'str')
    t.equal(value, '')
  }
  {
    const buffer = error('simple-string')
    const [{type, value}, offset] = readSimpleString(buffer, 1)
    t.equal(offset, buffer.length)
    t.equal(type, 'str')
    t.equal(value, 'simple-string')
  }
})

tap.test('proto.readError()', async t => {
  {
    const buffer = error(null)
    const [{type, value}, offset] = readError(buffer, 1)
    t.equal(offset, buffer.length)
    t.equal(type, 'err')
    t.equal(value, '')
  }
  {
    const buffer = error('')
    const [{type, value}, offset] = readError(buffer, 1)
    t.equal(offset, buffer.length)
    t.equal(type, 'err')
    t.equal(value, '')
  }
  {
    const buffer = error('error')
    const [{type, value}, offset] = readError(buffer, 1)
    t.equal(offset, buffer.length)
    t.equal(type, 'err')
    t.equal(value, 'error')
  }
})

tap.test('proto.readInteger()', async t => {
  {
    const buffer = integer(13)
    const [{type, value}, offset] = readInteger(buffer, 1)
    t.equal(offset, buffer.length)
    t.equal(type, 'int')
    t.equal(value, 13)
  }
  {
    const buffer = integer(-13)
    const [{type, value}, offset] = readInteger(buffer, 1)
    t.equal(offset, buffer.length)
    t.equal(type, 'int')
    t.equal(value, -13)
  }
})

tap.test('proto.readBulkString()', async t => {
  const buffer = bulkString('bulk-string')
  const [{type, value}, offset] = readBulkString(buffer, 1)
  t.equal(offset, buffer.length)
  t.equal(type, 'blk')
  t.equal(value.toString(), 'bulk-string')
})

tap.test('proto.readArray()', async t => {
  {
    const buffer = array([1, 2])
    const [{type, value}, offset] = readArray(buffer, 1)
    t.equal(offset, buffer.length)
    t.equal(type, 'arr')
    t.equal(json(value), json([
      {type: 'int', value: 1},
      {type: 'int', value: 2}
    ]))
  }
  {
    const buffer = array(['first', 'second'])
    const [{type, value}, offset] = readArray(buffer, 1)
    t.equal(offset, buffer.length)
    t.equal(type, 'arr')
    t.equal(json(value), json([
      {type: 'blk', value: 'first'},
      {type: 'blk', value: 'second'}
    ]))
  }
})
