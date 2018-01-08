const elasticsearch = require('elasticsearch');
const config = require('../configs/elastic');
const host = process.env.ELASTICSEARCH_HOST || 'localhost:9200'

function esClient(config, req,res,next){

  const client = new elasticsearch.Client({host})

  client.ping({ requestTimeout: 1000 }, function (err) {
    if (err) return res.send({success: false, message: err.message})

    req.esClient = client
    return next()
  })
}

module.exports = function (req,res,next){
  esClient(config,req,res,next)
}
