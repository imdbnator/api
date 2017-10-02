/*
Todo
  - TMDb's crew is being populated with cast.
  - Replace poster_path with poster in cast.
  - Remove unneccary data like cast_id from tmdb cast object.
 */
const _ = require('lodash')
const langISO = require('iso-639-1')
const config = require('../configs/mongo.json')

function parseDoc (source, document) {
  // (CRITICAL): Every incFields must have imdbid or else it will break populateEntries. Read critical there.
  const fieldMap = config.collections[source].fields
  const incFields = {
    tmdb: ['tmdbid', 'imdbid', 'title', 'title_original', 'year', 'tagline', 'rating', 'votes', 'popularity', 'plot', 'language', 'genres', 'credits', 'runtime', 'keywords', 'poster', 'backdrop', 'trailers', 'budget', 'revenue', 'collection', 'homepage', 'adult'],
    imdb: ['imdbid', 'title', 'rating', 'votes', 'genres', 'runtime', 'awards']
    // rudb: ['rudbid', 'imdbid', 'title']
  }

  // Populate only incFields from the document
  const parsedDoc = {}
  for (var i = 0; i < incFields[source].length; i++) {
    const goodField = incFields[source][i]
    if (goodField in fieldMap) {
      const docField = fieldMap[goodField]
      const docContent = document[docField]
      parsedDoc[goodField] = docContent
    }
  }

  // Prettify incFields
  switch (source) {
    case 'tmdb':
      for (let field in parsedDoc) {
        if (_.isEmpty(parsedDoc[field])) continue

        let content = parsedDoc[field]
        switch (field) {
          case 'year':
            parsedDoc[field] = parseInt(content.match(/(?:18|19|20)\d{2}/g)[0])
            break
          case 'language':
            parsedDoc[field] = langISO.getName(content)
            break
          case 'genres':
            parsedDoc[field] = content.map(genre => genre.name)
            break
          case 'credits':
            parsedDoc['cast'] = content['cast'].map((cast) => {
              const { id, name, gender, character, profile_path } = cast
              return { tmdbid: _.isNumber(id) ? id : null, name, gender, character, job: 'Cast', poster: profile_path }
            }).slice(0, 5)
            parsedDoc['crew'] = content['crew'].map((crew) => {
              const { id, name, gender, job, profile_path } = crew
              return { tmdbid: _.isNumber(id) ? id : null, name, gender, job: !_.isEmpty(job) ? job : null, poster: profile_path }
            }).slice(0, 5)
            delete parsedDoc[field]
            break
          case 'keywords':
            parsedDoc[field] = content['keywords'].map(keyword => keyword.name)
            break
          case 'trailers':
            parsedDoc[field] = content['youtube']
            break
          default:
            break
        }
      }
      break
    case 'imdb':
      for (var field in parsedDoc) {
        let content = parsedDoc[field]
        switch (field) {
          case 'votes':
            parsedDoc[field] = (typeof content === 'string') ? parseInt(content.replace(/\,/g, '')) : content
            break;
          case 'rating':
            parsedDoc[field] = (typeof content === 'string') ? parseFloat(content) : content
            break
          case 'cast':
            parsedDoc['cast'] = content.split(', ').map((name) => { return {tmdbid: null, name, gender: null, job: 'Cast', poster: null} })
            break
          case 'director':
            parsedDoc['crew'] = content.split(', ').map((name) => { return {tmdbid: null, name, gender: null, job: 'Director', poster: null} })
            delete parsedDoc[field]
            break
          case 'writer':
            parsedDoc['crew'] = content.split(', ').map((name) => { return {tmdbid: null, name, gender: null, job: 'Writer', poster: null} })
            delete parsedDoc[field]
            break
          case 'country':
          case 'genres':
            parsedDoc[field] = content.split(', ')
            break
          case 'runtime':
            parsedDoc[field] = (typeof content === 'string') ? parseInt(content.split(' min')[0]) : content
            break
          default:
        }
      }
      break
    default:
  }

  return parsedDoc
}

module.exports = parseDoc

// Example
// console.log(JSON.stringify(parseDoc('tmdb', require('../samples/tmdbDoc'))))
// console.log(JSON.stringify(parseDoc('imdb', require('../samples/imdbDoc'))))
