const socketIO = require('socket.io')
const axios = require('axios')
// const shell = require('shelljs');
const Promise = require('bluebird');
const isEmpty = require('lodash.isempty')
const isNumber = require('lodash.isnumber')
const moment = require('moment');
const port = process.env.PORT || 8081

// My modules
const ElasticSearch = require('../libs/ElasticSearch')
const guessJS = require('../libs/guess');

// Increase max event listeners on a socket.
process.setMaxListeners(30)

function processDaemon (server) {

  // Start socket.io and bind to API
  const io = socketIO.listen(server, {path: '/daemon/process'})

  io.on('connection', function (socket) {

    // Get collectiom inputs
    socket.on('start', ({id, processAll}) => {
      axios({
        url: `http://localhost:${port}/collection/${id}`,
        method: 'get'
      })
      .then((response) => {
        const { status, data } = response
        if (status !== 200) throw new Error(`Server status error unknown ${status}`)
        if (!data.success) throw new Error(data.message)


        const esClient = new ElasticSearch({index: 'tmdb', type: 'movie', mode: 'match'})
        const newEntries = []
        const collection = data.collection
        const entries = collection.entries
        const total = entries.length
        let processsed = 0

        // Check if collection processed
        if (collection.processed && !processAll) throw new Error('Collection already proccesed!')

        Promise.map(entries, function(value,i){
          return new Promise((resolve, reject) => {
            const entry = entries[i]
            const { input, search } = entry
            if (search.found && !processAll) return resolve()

            // const guess = JSON.parse(shell.exec(`guessit "${input.name}" --json`, {silent:true}).stdout) // Extremely slow.
            const guess = guessJS(input.name) //guessPY(input.name)
            const response = {success: false, input: input.name, guess, message: null, took:null, processsed: processsed++, total}

            if (isEmpty(guess.title)){
              newEntries.push(entry)
              socket.emit('processing', Object.assign(response, {message: 'Title not found.'}))
              reject()
              return
            }

            entry.guesser.engine = 'js'
            entry.guesser.found = true
            entry.guesser.guess = guess

            esClient.matchSearch(guess)
            .then((result) => {
              resolve()

              if (isEmpty(result.elasticsearch.hits)) {
                newEntries.push(entry)
                socket.emit('processing', Object.assign(response,{message: 'Title not found.'}))
                return
              }

              const bestHit = result.elasticsearch.hits[0]
              const { tmdbid, imdbid, title, title_original, year, rating, votes, popularity, language, poster, backdrop } = bestHit._source

              entry.search.found = true
              entry.search.result.type = bestHit._type
              entry.search.result.tmdbid = (isNumber(tmdbid)) ? tmdbid : null
              entry.search.result.imdbid = (!isEmpty(imdbid)) ? imdbid : null
              newEntries.push(entry)

              socket.emit('processing', Object.assign(response, {
                success: true,
                took: result.elasticsearch.took,
                result: { tmdbid, imdbid, title, title_original, year, rating, votes, popularity, language, poster, backdrop }
              }))

              return

            })
            .catch((result) => {
              resolve()
              newEntries.push(entry)
              socket.emit('processing', Object.assign(response, {message: result.message}))
            })
          })
        }, {concurrency: 5})
        .then(() => {
          socket.emit('processed')
          axios({
            url: `http://localhost:${port}/collection/${id}/entries`,
            method: 'post',
            data: {entries: newEntries}
          })
          .then((response) => {
            const { status, data } = response
            if (status !== 200) throw new Error(`Server status error unknown ${status}`)
            if (!data.success) throw new Error(data.message)

            socket.emit('saved')
            socket.disconnect(true)
          })
          .catch((err) => {
            socket.emit('failed', {success: false, message: `API Server (Collection Entries) error: ${err.message}`})
            socket.disconnect(true)
          })
        })
        .catch((err) => {
          socket.emit('failed', {success: false, message: `Daemon (Promise): Was unable to finish processing queue: ${err.message}`})
          socket.disconnect(true)
        })

      })
      .catch((err) => {
        socket.emit('failed', {success: false, message: `API Server (Collection ID) error: ${err.message}.`})
        socket.disconnect(true)
      })
    })
  })
}

module.exports = processDaemon
