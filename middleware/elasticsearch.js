const elasticsearch = require('elasticsearch');
const host = require('../configs').elasticsearch
const config = require('../configs/elastic');

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
