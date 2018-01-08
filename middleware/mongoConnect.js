const mongoose = require('mongoose')

function mongoConnect (req, res, next) {
  mongoose.Promise = global.Promise
  const db = mongoose.connect('mongodb://0.0.0.0:27017/imdbnator', { useMongoClient: true })
  db.on('error', (err) => {
    return res.send({success: false, message: err.message})
  })
  db.once('open', () => {
    req.db = db
    return next()
  })
}

module.exports = mongoConnect
