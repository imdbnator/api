const processDaemon = require('./process')

function startDaemon (server) {
  processDaemon(server)
}

module.exports = startDaemon
