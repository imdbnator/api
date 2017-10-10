const _ = require('lodash');
const express = require('express')
const router = express.Router()
const mongoConnect = require('../middleware/mongoConnect')

const Collection = require('../models/collection')

router.use(mongoConnect)

router.get('/', (req,res) => {
  const page = (_.isNumber(parseInt(req.query.page)) && parseInt(req.query.page) >= 0) ? parseInt(req.query.page) : 0
  const perPage = 10
  return Collection.find({}).sort('-created').skip(page * perPage).limit(perPage).exec(function(err, docs){
    req.db.close()
    res.render('debug.html', {docs, page})
  });
})

router.get('/echo/:input', (req, res) => {
  res.send({success: true, response: (req.params.input) ? (req.params.input) : null})
})

module.exports = router
