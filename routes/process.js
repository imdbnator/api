/*
Todo
  - URL without http is giving an error on w3.org as bad request. Need to convert all url to the one with http://{url}
  - Include locale and language specific searches in elasticsearch
 */
const express = require('express')
const bodyParser = require('body-parser')
const validator = require('validator')
const axios = require('axios')
const isEmpty = require('lodash.isempty')
const includes = require('lodash.includes');
const router = express.Router()

// Custom modules
const guess = require('../libs/guess');
const formatElasticResponse = require('../libs/formatElasticResponse')
const guessJS = require('../libs/guess');

// Middleware
const cors = require('../middleware/cors')
// const esClient = require('../middleware/elasticsearch')

// Apply middleware
router.use(cors)
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true}))
// router.use(esClient)

// Define routes
router.get('/guess/:input?', (req,res) => {
  if (isEmpty(req.params.input)) return res.send({success: false, message: 'Input cannot be empty.'})

  const guessJS = guess(req.params.input)
  return res.send({success: true, guess: guessJS})
})
router.get('/search', (req, res) => {
  const { input, index, mode, type } = req.query
  if (isEmpty(input)) return res.send({success: false, message: 'Input cannot be empty.'})
  if (isEmpty(mode)) return res.send({success: false, message: 'Empty mode.'})
  if (isEmpty(index)) return res.send({success: false, message: 'Empty index.'})
  if (isEmpty(type)) return res.send({success: false, message: 'Empty type.'})


  const ElasticSearch = require('../libs/ElasticSearch')
  const esClient = new ElasticSearch({ index, type, mode})
  switch (mode) {
    case 'prefix':
      esClient.prefixSearch(input)
      .then(result => res.send(Object.assign(result,{mode, input})))
      .catch(result => res.send(result))
      break;
    case 'match':
      const guess = guessJS(input)
      esClient.matchSearch(guess)
      .then(result => res.send(Object.assign(result,{mode, input})))
      .catch(result => res.send(result))
      break;
    default:
      res.send({success: false, message: 'Invalid mode.'})
  }


})
router.get('/title/:title', (req, res) => {
  if (isEmpty(req.params.title)) {
    return res.send({success: false, message: 'No title provided.'})
  }

  let properties = {
    table: (!isEmpty(req.query.table)) ? req.query.table : 'imdb',
    ranking: (!isEmpty(req.query.ranking)) ? req.query.ranking : 'best',
    engine: 'mysql'
  }

  processTitles([req.params.title], properties, function onTitle (result) {
    return res.send(result)
  })
})
router.get('/webpage/:url', (req, res) => {
  const url = decodeURIComponent(req.params.url)
  if (!validator.isURL(url)) {
    return res.send({success: false, message: `Invalid URL: ${url}`})
  }
  axios(`https://www.w3.org/services/html2txt?noinlinerefs=on&nonums=on&url=${encodeURI(url)}`)
    .then((response) => {
      const { status, data } = response
      if (status !== 200) throw new Error('Please try again later. http://w3.org service is down.')
      if (isEmpty(data)) throw new Error(`The webpage ${url} is empty.`)

      const regex = new RegExp(/(?:\[\d+\])(.*(?:19|20)\d{2}.)/, 'gm')
      let matches = []
      let match
      while (match = regex.exec(data)) {
        matches.push(match[1])
      }

      if (isEmpty(matches)) throw new Error(`We were unable to find titles on <a href="${url}" target="_blank">${url}<a/>`)

      res.send({success: true, titles: matches})
    })
    .catch((err) => {
      res.send({success: false, message: err.message})
    })
})

module.exports = router
