/*
  Bugs: If imdbRating and imdbVotes are null it weights it high. A movie like "The loard Batman" is being scored higher than "Batman Begins" for a fuzzy search "Bateman" because of this.
 */

const elasticsearch = require('elasticsearch')
const isEmpty = require('lodash.isempty')
const includes = require('lodash.includes')
const host =require('../configs').elasticsearch

const formatElasticResponse = require('./formatElasticResponse')

class ElasticSearch {
  constructor (props = {index: 'tmdb', type: 'movie', mode: 'prefix'}) {
    this.index = (!isEmpty(props.index) && includes(['tmdb', 'imdb', 'all'], props.index)) ? props.index : 'tmdb'
    this.type = (!isEmpty(props.type) && includes(['movie', 'tv', 'season', 'episode', 'any'], props.type)) ? props.type : 'movie'
    this.mode = (!isEmpty(props.mode) && includes(['prefix', 'match'], props.mode)) ? props.mode : 'prefix'

    this._esClient = new elasticsearch.Client({
      host,
      log: {
        type: 'stdio',
        levels: [],
        // levels: ['error','warning'] //(default)
      }
    })
  }

  _queryConstruct(input){
    const { index, type, mode } = this
    const { title, year, language, tmdbid, imdbid } = input
    const baseQueries = {
      imdb: {
        movie: {
          prefix: {"query":{"bool":{"must":[{"match":{"Title":{"query":title,"fuzziness":1,"max_expansions":5}}}],"should":[{"match_phrase":{"Title.keyword":{"query":title,"boost":3}}},{"range":{"imdbVotes":{"gte":100000,"boost":10}}},{"range":{"imdbVotes":{"gte":10000,"boost":5}}},{"range":{"imdbVotes":{"gte":1000,"boost":1}}}]}},"highlight":{"pre_tags":["<b>"],"post_tags":["</b>"],"fields":{"Title":{}}}}
        }
      },
      tmdb: {
        movie: {
          prefix: {"query":{"function_score":{"query":{"bool":{"must":[{"multi_match":{"query":title,"fields":["original_title","title","alternative_title_US","alternative_title_RU","alternative_title_FR","alternative_title_DE","alternative_title_JP","alternative_title_CN","alternative_title_IN"],"type":"phrase_prefix","max_expansions":1000,"slop":10}}]}},"functions":[{"field_value_factor":{"field":"popularity","factor":0.2,"modifier":"sqrt","missing":1}},{"field_value_factor":{"field":"vote_count","factor":0.5,"modifier":"log1p","missing":1}}],"max_boost":10}},"highlight":{"pre_tags":["<i>"],"post_tags":["</i>"],"fields":{"title":{},"alternative_title_*":{}}}},
          match: {"query":{"function_score":{"query":{"bool":{"must":[{"match":{"title":{"query":title,"fuzziness":2}}}],"should":[{"match_phrase":{"title.keyword":{"query":title,"boost":10}}}]}},"functions":[{"field_value_factor":{"field":"vote_count","factor":0.5,"modifier":"log1p","missing":1}}],"max_boost":5}},"highlight":{"pre_tags":["<u>"],"post_tags":["</u>"],"fields":{"title":{}}}}
        }
      }
    }

    if (!isEmpty(year)){
      if (year.toString().match(/(?:19|20)\d{2}/g)){
        baseQueries[index][type][mode].query.function_score.query.bool.must.push({
          "terms": {
            "release_date": [year-1,year,year+1]
          }
        })
      }
    }

    if (!isEmpty(language)) {
      baseQueries[index][type][mode].query.function_score.query.bool.should.push({
        "match": {
          "language": {
            "query": language,
            "boost": 5
          }
        }
      })
    }

    if (!isEmpty(tmdbid)) {
      if (tmdbid.toString().match(/\d*/g)){
        return {
          "query": {
            "term": {
              "id": {
                "value": tmdbid
              }
            }
          }
        }
      }
    }

    if (!isEmpty(imdbid)) {
      if (imdbid.toString().match(/tt\d{7}/g)){
        return {
          "query": {
            "term": {
              "imdb_id.keyword": {
                "value": imdbid
              }
            }
          }
        }
      }
    }

    return baseQueries[index][type][mode]
  }

  _search (input) {
    const { index, type, _esClient } = this

    if (isEmpty(input)) {
      return Promise.reject({success: false, message: 'Input cannot be empty: ${input}'})
    }

    return new Promise((resolve, reject) => {
      _esClient.ping({ requestTimeout: 10000 }, (err) => {
        if (err) {
          return reject({success: false, message: err.message})
        }
        _esClient.search({ index, type, body: this._queryConstruct(input)})
        .then((response) => {
          if (response.timed_out) throw new Error('esClient response timed out.')
          return resolve({success: true, elasticsearch: formatElasticResponse(response)})
        })
        .catch((err) => {
          return reject({success: false, message: err.message})
        })
      })
    })
  }

  prefixSearch (title) {
    if (isEmpty(title)) {
      return Promise.resolve({success: false, message: `Unable to guess title of ${title}`})
    }

    this.mode = 'prefix'
    return this._search({title})
  }

  _idSearch (imdbid) {
    if (isEmpty(imdbid) || ! imdbid.match(/tt\d{7}/g)) {
      return Promise.reject({success: false, message: `Invalid IMDb id.`})
    }
    return this._search({imdbid})
  }

  matchSearch ({ title, year, language, imdbid }) {
    if (!isEmpty(imdbid)){
      return this._idSearch(imdbid)
    }

    if (isEmpty(title)) {
      return Promise.reject({success: false, message: `Invalid title provided: ${title}`})
    }

    this.mode = 'match'
    return this._search({title, year, language})
  }

}

module.exports = ElasticSearch

// Debug
if (process.env.DEBUG){
  const argv = require('minimist')(process.argv.slice(2));
  const ES = new ElasticSearch({index: 'tmdb', type: 'movie', mode: 'prefix'})

  const title = argv['t']

  // Process title
  ES.matchSearch({title})
  .then(result => console.log(result))
  .catch(err => console.error(err))

}
