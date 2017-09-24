const isEmpty = require('lodash.isempty')
const config = require('../configs/elastic')

function formatResponse (response) {
  newReponse = {
    took: response.took,
    timed_out: response.timed_out,
    total: response.hits.total,
    max_score: response.hits.max_score,
    hits: []
  }

  if (isEmpty(response.hits.hits)) return newReponse

  const hits = response.hits.hits
  for (let i = 0; i < hits.length; i++) {
    const hit = hits[i]
    const { _index, _type, _score, _source, highlight } = hit
    const newHit = {
      _index,
      _type,
      _score,
      _source: {},
      highlight
    }

    const fieldMap = config.indices[_index].types[_type].fields
    const incFields = ['tmdbid', 'imdbid', 'title', 'title_original', 'year', 'rating', 'votes', 'popularity', 'language', 'poster', 'backdrop']

    // Include basic fields
    for (let j = 0; j < incFields.length; j++) {
      const field = incFields[j]

      newHit._source[field] = (fieldMap[field] in _source) ? _source[fieldMap[field]] : null
    }

    // Include matched fields and alternative title field
    for (let field in highlight) {
      newHit._source[field] = _source[field]
    }

    newReponse.hits.push(newHit)
  }

  return newReponse
}

module.exports = formatResponse

// Example
// const mockResponse = require('../samples/elasticResponse')
// console.log(JSON.stringify(formatResponse(mockResponse)))
