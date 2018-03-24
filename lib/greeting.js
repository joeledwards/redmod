module.exports = greeting

function greeting ({pid, ip, port, version}) {
  const {blue, green, orange, red, yellow} = require('@buzuli/color')
  const url = 'https://npmjs.com/package/redmod'
  const message = ` Started server...
${red('                _._')}
${red("           _.-''   ''-._")}
${red(`      _.-''     ${green('_____')}   ''-._`)}           redmod ${blue(version)}
${red(`  .-''        ${green('//     \\\\')}      ''-._`)}
${red(` (           ${green('//       \\\\')}          )`)}      PID: ${orange(pid)}
${red(` |'-._       ${green('\\\\       //')}      _.-'|`)}       IP: ${yellow(ip)}
${red(` |    '-._    ${green('\\\\_____//')}   _.-'    |`)}     Port: ${orange(port)}
${red("  '-._    '-._        _.-'    _.-'")}
${red(" |'-._'-._    '-.__.-'    _.-'_.-'|")}
${red(" |    '-._'-._        _.-'_.-'    |")}     ${green(url)}
${red("  '-._    '-._'-.__.-'_.-'    _.-'")}
${red(" |'-._'-._    '-.__.-'    _.-'_.-'|")}
${red(" |    '-._'-._        _.-'_.-'    |")}
${red("  '-._    '-._'-.__.-'_.-'    _.-'")}
${red("      '-._    '-.__.-'    _.-'")}
${red("          '-._        _.-'")}
${red("              '-.__.-'")}
  `

  console.log(message)
}
