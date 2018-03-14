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
  array
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

const nullBulkString = Buffer.from(`$-1\r\n`)
function bulkString (text) {
  if (text == null) {
    return nullBulkString
  } else {
    const textLength = Buffer.byteLength(text)
    return Buffer.from(`$${textLength}\r\n${text}\r\n`)
  }
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
        : nullBulkString
    })

    return Buffer.concat([Buffer.from(`*${buffers.length}\r\n`), ...buffers])
  }
}
