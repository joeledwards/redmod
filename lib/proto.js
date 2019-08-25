/* The implementation of the Redis protocols.
 *
 * https://redis.io/topics/protocol
 *
 * Data Types
 * - '+' : Simple String
 * - '-' : Error
 * - ':' : Integer
 * - '$' : Bulk String
 * - '*' : Array
 */

module.exports = {
  simpleString,
  error,
  integer,
  bulkString,
  array,
  ok,
  nil,
  parse,
  simplify,
  readSimpleString,
  readError,
  readInteger,
  readBulkString,
  readArray
}

const r = require('ramda')

function simplify (record) {
  switch (record.type) {
    case 'arr': return r.flatten(record.value.map(simplify))
    case 'blk': return [record.value.toString()]
    case 'str': return record.value.split(' ')
    default: return [record.value]
  }
}

function unwrap (result, offset) {
  return offset > 0 ? result : result[0]
}

function parse (buffer, offset = 0) {
  switch (String.fromCharCode(buffer.readUInt8(offset))) {
    case '+': return unwrap(readSimpleString(buffer, offset + 1), offset)
    case '-': return unwrap(readError(buffer, offset + 1), offset)
    case ':': return unwrap(readInteger(buffer, offset + 1), offset)
    case '$': return unwrap(readBulkString(buffer, offset + 1), offset)
    case '*': return unwrap(readArray(buffer, offset + 1), offset)
    default: return unwrap(readSimpleString(buffer, offset), offset)
  }
}

function readSimpleString (buffer, offset) {
  const end = buffer.indexOf('\r\n', offset)
  return [{
    type: 'str',
    value: buffer.slice(offset, end).toString()
  }, end + 2]
}

function readError (buffer, offset) {
  const end = buffer.indexOf('\r\n', offset)
  return [{
    type: 'err',
    value: buffer.slice(offset, end).toString()
  }, end + 2]
}

function readInteger (buffer, offset) {
  const end = buffer.indexOf('\r\n', offset)
  return [{
    type: 'int',
    value: parseInt(buffer.slice(offset, end).toString())
  }, end + 2]
}

function readBulkString (buffer, offset) {
  const [{ value: strLen }, startIndex] = readInteger(buffer, offset)
  const end = startIndex + strLen
  return [{
    type: 'blk',
    value: buffer.slice(startIndex, end).toString()
  }, end + 2]
}

function readArray (buffer, offset) {
  const [{ value: arrLen }, startIndex] = readInteger(buffer, offset)
  const array = []
  let nextOffset = startIndex
  for (let i = 0; i < arrLen; i++) {
    const [record, updatedOffset] = parse(buffer, nextOffset)
    nextOffset = updatedOffset
    array.push(record)
  }
  return [{
    type: 'arr',
    value: array
  }, nextOffset]
}

function simpleString (text) {
  return Buffer.from(`+${text || ''}\r\n`)
}

function error (error) {
  return Buffer.from(`-${error || ''}\r\n`)
}

function integer (number) {
  return Buffer.from(`:${number.toFixed(0)}\r\n`)
}

const lineTerm = Buffer.from('\r\n')
const nullBulkString = Buffer.from(`$-1\r\n`)
function bulkString (text) {
  if (text == null) {
    return nullBulkString
  } else if (text instanceof Buffer) {
    const textLength = Buffer.byteLength(text)
    return Buffer.concat(
      Buffer.from(`$${textLength}\r\n`),
      text,
      lineTerm
    )
  } else {
    const textLength = Buffer.byteLength(text)
    return Buffer.from(`$${textLength}\r\n${text}\r\n`)
  }
}

function nil () {
  return nullBulkString
}

const okString = simpleString('OK')
function ok () {
  return okString
}

const nullArray = Buffer.from(`*-1\r\n`)
function array (values) {
  if (values == null) {
    return nullArray
  } else {
    const buffers = values.map(v => {
      const vType = typeof v
      return (vType === 'string')
        ? bulkString(v)
        : (vType === 'number')
          ? integer(v)
          : (v instanceof Array)
            ? array(v)
            : (v instanceof Buffer)
              ? bulkString(v)
              : nullBulkString
    })

    return Buffer.concat([Buffer.from(`*${buffers.length}\r\n`), ...buffers])
  }
}
