const express = require('express')
const router = express.Router()
const mongoConnect = require('../middleware/mongoConnect')

const Collection = require('../models/collection')

router.use(mongoConnect)

router.get('/', (req,res) => {
  return Collection.find({}).sort('-created').limit(10).exec(function(err, docs){
    req.db.close()
    res.render('debug.html', {docs})
  });
})

router.get('/echo/:input', (req, res) => {
  res.send({success: true, response: (req.params.input) ? (req.params.input) : null})
})

module.exports = router
