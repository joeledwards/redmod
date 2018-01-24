module.exports = greeting

function greeting ({pid, port, version}) {
  const message = ` Started server...
                _._
           _.-''   ''-._
      _.-''     _____   ''-._           redmod ${version}
  .-''        //     \\\\      ''-._
 (           //       \\\\          )     Port: ${port}
 |'-._       \\\\       //      _.-'|     PID: ${pid}
 |    '-._    \\\\_____//   _.-'    |
  '-._    '-._        _.-'    _.-'
 |'-._'-._    '-.__.-'    _.-'_.-'|     https://npmjs.com/package/redmod
 |    '-._'-._        _.-'_.-'    |
  '-._    '-._'-.__.-'_.-'    _.-'
 |'-._'-._    '-.__.-'    _.-'_.-'|
 |    '-._'-._        _.-'_.-'    |
  '-._    '-._'-.__.-'_.-'    _.-'
      '-._    '-.__.-'    _.-'
          '-._        _.-'
              '-.__.-'
  `

	console.log(message)
}
