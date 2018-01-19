const socketIO = require('socket.io')
const axios = require('axios')
// const shell = require('shelljs');
const Promise = require('bluebird');
const isEmpty = require('lodash.isempty')
const isNumber = require('lodash.isnumber')
const moment = require('moment');
const port = require('../configs').port

// My modules
const ElasticSearch = require('../libs/ElasticSearch')
const guessJS = require('../libs/guess');

function processDaemon (server) {

  // Start socket.io and bind to API
  const io = socketIO.listen(server, {path: '/daemon/process'})

  io.on('connection', function (socket) {

    // Get collectiom inputs
    socket.on('start', ({id, reprocess}) => {
      axios({
        url: `http://localhost:${port}/collection/${id}`,
        method: 'get'
      })
      .then((response) => {
        const { status, data } = response
        if (status !== 200) throw {status: 160, message: `Status ${status}`}
        if (!data.success) throw {status: 170, message: data.message}


        const esClient = new ElasticSearch({index: 'tmdb', type: 'movie', mode: 'match'})
        const newEntries = []
        const collection = data.collection
        const entries = collection.entries
        const total = entries.length
        let processsed = 0

        // Check if collection processed
        if (collection.processed && !reprocess) throw {status: 171, message: 'Collection already proccesed!'}

        Promise.map(entries, function(value,i){
          return new Promise((resolve, reject) => {
            const entry = entries[i]
            const { input, search } = entry

            // If entry was already processed
            if (search.found && !reprocess){
              newEntries.push(entry)
              return resolve()
            }

            // const guess = JSON.parse(shell.exec(`guessit "${input.name}" --json`, {silent:true}).stdout) // Extremely slow.
            const guess = guessJS(input.name) //guessPY(input.name)
            const response = {success: false, status: 172, input: input.name, guess, message: null, took:null, processsed: processsed++, total}

            // Check a title was found by guesser
            if (isEmpty(guess.title)){
              newEntries.push(entry)
              socket.emit('processing', Object.assign(response, {message: 'Title not found.'}))
              resolve()
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
              socket.emit('failed', {success: false, status: 160, message: `ElasticSearch (ERROR): ${result.message}`})
              socket.disconnect(true)
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
            if (status !== 200) throw {status: 160, message: `Status ${status}`}
            if (!data.success) throw {status: 160, message: data.message}

            socket.emit('saved')
            socket.disconnect(true)
          })
          .catch((err) => {
            socket.emit('failed', {success: false, status: 160, message: `API Server - Collection Entries (ERROR): ${err.message}`})
            socket.disconnect(true)
          })
        })
        .catch((err) => {
          socket.emit('failed', {success: false, status: (err.status) ? err.status : 160, message: `API Server - Daemon (ERROR): ${err}`})
          socket.disconnect(true)
        })

      })
      .catch((err) => {
        socket.emit('failed', {success: false, status: (err.status) ? err.status : 160, message: `API Server - Collection ID (ERROR): ${err.message}.`})
        socket.disconnect(true)
      })
    })
  })
}

module.exports = processDaemon
