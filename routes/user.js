const express = require('express')
const mongoose = require('mongoose')
const crypto = require('crypto')
const router = express.Router()

// Mongoose user schema
const User = require('../models/user')

// Middleware
const cors = require('../middleware/cors')

// Todo: This can be made better. Find out how to create a mongoconnection and run it for a given route
// Create mongo instance
let db = null

function mongoConnect (req, res, next) {
  mongoose.Promise = global.Promise
  mongoose.connect('mongodb://localhost/imdbnator')
  db = mongoose.connection
  db.on('error', (err) => {
    return res.send({success: false, error: err.message})
  })
  db.once('open', () => {
    return next()
  })
}

// Apply middleware
router.use(mongoConnect)
router.use(cors)

// Define routes
router.post('/', (req, res) => {
  let user = new User({
    username: req.query.username,
    password: crypto.createHash('md5').update(req.query.password).digest('hex'),
    email: req.query.email,
    name: req.query.name
  })

  return user.save((err, rows) => {
    db.close()
    if (err) {
      let messages = []
      for (var property in err.errors) {
        messages.push(err.errors[property].message)
      }
      res.status(403)
      return res.send({
        error: messages.join(' ')
      })
    }
    res.status(201)
    return res.send({success: 'User has been created.'})
  })
})
router.get('/', (req, res) => {
  return User.findOne({
    username: req.query.username,
    password: crypto.createHash('md5').update(req.query.password).digest('hex')
  }, (err, row) => {
    db.close()
    if (err) {
      res.status(403)
      return res.send(err.message)
    }
    if (row === null) {
      res.status(201)
      return res.send({error: 'User ID and Password combination is invalid.'})
    }
    res.status(200)
    return res.send(row)
  })
})
router.put('/:id', (req, res) => {
  let updateFields = {}
  if (req.query.username) updateFields.username = req.query.username
  if (req.query.password) updateFields.password = req.query.password
  if (req.query.email) updateFields.email = req.query.email
  if (req.query.name) updateFields.name = req.query.name

  // running validators on unique field is getting bricked by uniqueValidator plugin. It dispays an error no matter what! Look into this.
  return User.findOneAndUpdate({username: req.params.id}, updateFields, {
    // runValidators: true
  }, (err, rows) => {
    db.close()
    if (err) {
      let messages = []
      res.status(403)
      for (var property in err.errors) {
        messages.push(err.errors[property].message)
      }
      return res.send({
        error: messages.join(' ')
      })
    }
    if (rows === null) {
      return res.send({error: 'User ID not found.'})
    }
    res.status(200)
    return res.send({success: 'User\'s info has been updated.'})
  })
})
router.unlock('/:id', (req, res) => {
  return User.findOneAndUpdate({username: req.params.id}, {activated: true}, (err, row) => {
    db.close()
    if (err) {
      res.status(403)
      return res.send(err.message)
    }
    if (row === null) {
      res.status(201)
      return res.send({error: 'User ID not found.'})
    }
    res.status(200)
    return res.send({success: 'User account has been activated.'})
  })
})

module.exports = router
