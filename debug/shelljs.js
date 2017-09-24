const shell = require('shelljs');
const guess = JSON.parse(shell.exec(`guessit "foo [2014]" --json`, {silent:true}).stdout)

console.log(guess);
