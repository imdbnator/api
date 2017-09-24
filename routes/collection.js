/*
Bugs
  - findOneAndUpdate is not respecting the schema when usng child document search. For instance, in the settings route,I can have a description with an extremely large string and it saving it in the DB.
  - Even findOneAndUpdate on UNLOCK route doesnt work. If I set settings.private as "foo" even though the Schema says it boolean, IT UPDATES!!
  - Return the previous id if the user has not provded a new id for an existing hash.
  - The current deepCloning using JSON.stringify(JSON.parse()) is bad. It's slowing down the response to the server
  - When using { runValidators: true } (https://stackoverflow.com/questions/15627967/why-mongoose-doesnt-validate-on-update) for validating user input for updating settings for eg, it works perfectly.
  But for the uniqueValidator of is also being triggered because an ID already exists.
  - Settings are not being run against validators!
  - Settings are critical.. user can pump huge amounts of data through the 'description' or 'nam' field in the DB and slow it down.
 */


const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const shortid = require('shortid')
const md5 = require('md5')
const _ = require('lodash')

// My modules
const populateEntries = require('../libs/populateEntries')

// Mongoose collection schema
const Collection = require('../models/collection')

// Middleware
const mongoConnect = require('../middleware/mongoConnect')
const cors = require('../middleware/cors')

// Apply middleware
router.use(bodyParser.json({limit: '10mb'}))
router.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }))
router.use(mongoConnect)
router.use(cors)

// Define POST routes
router.post('/', (req, res) => {
  if (_.isEmpty(req.body)){
    return res.send({success: false, message: 'Empty request.'})
  }
  if (_.isEmpty(req.body.inputs)){
    return res.send({success: false, message: 'Inputs cannot be empty.'})
  }

  const inputs = req.body.inputs
  const titles = inputs.map(input => input.name)
  titles.sort()

  let collection = new Collection({
    id: (req.body.id) ? req.body.id : shortid.generate(),
    hash: md5(titles),
    type: req.body.type,
    entries: inputs.map((input, i) => {
      return Object.assign({entryid: i}, {input})
    }),
    misc: req.body.misc
  })

  return collection.save((err, row) => {
    req.db.close()
    if (err) {
      let messages = []
      for (var property in err.errors) {
        messages.push(err.errors[property].message)
      }
      return res.send({success: false, message: messages.join(' ')})
    }
    return res.send({success: true, message: 'Created collection.', id: row.id})
  })
})
router.post('/:id/entries', (req, res) => {
  if (_.isEmpty(req.body.entries)) {
    return res.send({success: false, message: 'New entries cannot be empty.'})
  }
  return Collection.findOneAndUpdate({id: req.params.id}, {entries: req.body.entries, processed: true}, (err, row) => {
    req.db.close()
    if (err) {
      return res.send({success: false, message: err.message})
    }
    return res.send({success: true, message: 'Collection entries has been updated.'})
  })
})

// Define GET routes
router.get('/:id', (req, res) => {
  return Collection.findOne({id: req.params.id}, (err, row) => {
    req.db.close()
    if (err) {
      return res.send({success: false, message: err.message})
    }
    if (_.isEmpty(row)) {
      return res.send({success: false, message: 'Collection ID does not exist.'})
    }
    return res.send({success: true, collection: row})
  })
})
router.get('/:id/inputs', (req, res) => {
  return Collection.findOne({id: req.params.id}, (err, row) => {
    req.db.close()
    if (err) {
      return res.send({success: false, message: err.message})
    }
    if (_.isEmpty(row)) {
      return res.send({success: false, message: 'Collection ID does not exist.'})
    }
    return res.send({success: true, inputs: row.entries.map(entry => entry.input.name)})
  })
})
router.get('/:id/populate/:sources', (req, res) => {
  return Collection.findOne({id: req.params.id}, (err, row) => {
    req.db.close()
    if (err) {
      return res.send({success: false, message: err.message})
    }
    if (_.isEmpty(row)) {
      return res.send({success: false, message: 'Collection ID does not exist.'})
    }
    if (_.isEmpty(req.params.sources)) {
      return res.send({success: false, message: 'Invalid sources.'})
    }

    const collection = row
    const entries = collection.entries
    populateEntries(entries, req.params.sources.split(','))
    .then((newEntries) => {
      let newCollection = JSON.parse(JSON.stringify(collection))
      newCollection['entries'] = newEntries
      res.send({success: true, collection: newCollection})
    })
    .catch(err => res.send({success: false, message: err.message}))
  })
})

// Define PUT routes
router.put('/:id/inputs', (req,res) => {
  if (_.isEmpty(req.body)){
    return res.send({success: false, message: 'Empty request.'})
  }
  if (_.isEmpty(req.body.inputs)){
    return res.send({success: false, message: 'Inputs cannot be empty.'})
  }

  return Collection.findOne({id: req.params.id}, (err, row) => {
    if (err) {
      req.db.close()
      return res.send({success: false, message: err.message})
    }
    if (_.isEmpty(row)) {
      return res.send({success: false, message: 'Collection ID was not found.'})
    }

    const entries = row.entries
    const lastid = entries.total
    const newEntries = req.body.inputs.map((input, i) => {
      return Object.assign({entryid: lastid + i}, {input})
    }) // (Bug): findOneAndUpdate does not create the default model values. Have to entry the schema?

    return Collection.findOneAndUpdate({id: req.params.id}, {entries: [...entries, ...newEntries], processed: false}, (err, row) => {
      req.db.close()
      if (err) {
        return res.send({success: false, message: err.message})
      }
      return res.send({success: true, message: 'New entries has been appended.'})
    })
  })
})
router.put('/:id/override/:entryid/to/:imdbid', (req, res) => {
  if (_.isEmpty(req.params.entryid)) return res.send({success: false, message: 'Empty Entry ID provided.'})
  if (_.isEmpty(req.params.imdbid)) return res.send({success: false, message: 'Empty IMDb ID provided.'})

  return Collection.findOneAndUpdate({id: req.params.id, 'entries.entryid': req.params.entryid}, {'$set': {'entries.$.modified': req.params.imdbid}}, (err, rows) => {
    req.db.close()
    if (err) {
      return res.send({success: false, message: err.message})
    }
    return res.send({success: true, message: `Overrided movie at ${req.params.entryid} to ${req.params.imdbid}.`})
  })
})
router.put('/:id/ignore/:movieid', (req, res) => {
  // (Bug): Search in array and replace properly.
  return Collection.findOneAndUpdate({id: req.params.id, 'entries.id': req.params.movieid}, {'$set': {'entries.$.ignore': true}}, (err, rows) => {
    req.db.close()
    if (err) {
      return res.send({success: false, message: err.message})
    }
    return res.send({success: true, message: `Ignored movie at ${req.params.movieid}.`})
  })
})
router.put('/:id/restore/:movieid', (req, res) => {
  return Collection.findOneAndUpdate({id: req.params.id, 'entries.id': req.params.movieid}, {'$set': {'entries.$.modified': false, 'entries.$.ignore': false}}, (err, rows) => {
    req.db.close()
    if (err) {
      return res.send({success: false, message: err.message})
    }
    return res.send({success: true, message: `Restored movie at ${req.params.movieid} to default.`})
  })
})
router.put('/:id/settings', (req, res) => {
  let updateFields = {}``
  if (req.query.id) updateFields['id'] = req.query.id
  if (req.query.name) updateFields['settings.name'] = req.query.name
  if (req.query.description) updateFields['settings.description'] = req.query.description
  if (req.query.private) updateFields['settings.private'] = req.query.private

  if (_.isEmpty(updateFields)) return res.send({success: false, message: 'Collection setting\'s cannot be empty.'})

  return Collection.findOneAndUpdate({id: req.params.id}, updateFields, (err, row) => {
    req.db.close()
    if (err) {
      return res.send({success: false, message: err.message})
    }
    if (_.isEmpty(row)) {
      return res.send({success: false, message: 'Collection ID was not found.'})
    }
    return res.send({success: true, message: "Collection's settings have been updated."})
  })
})

// Define LOCK, UNLOCK routes
router.lock('/:id', (req, res) => {
  return Collection.findOneAndUpdate({id: req.params.id}, {'settings.private': true}, (err, row) => {
    req.db.close()
    if (err) {
      return res.send({success: false, message: err.message})
    }
    if (_.isEmpty(row)) {
      return res.send({success: false, message: 'Collection ID was not found.'})
    }
    return res.send({success: true, message: 'Collection has been set to private.'})
  })
})
router.unlock('/:id', (req, res) => {
  return Collection.findOneAndUpdate({id: req.params.id}, {'settings.private': false}, (err, row) => {
    req.db.close()
    if (err) {
      return res.send({success: false, message: err.message})
    }
    if (_.isEmpty(row)) {
      return res.send({success: false, message: 'Collection ID was not found.'})
    }
    return res.send({success: true, message: 'Collection has been set to public.'})
  })
})
router.delete('/:id', (req, res) => {
  return Collection.deleteOne({id: req.params.id}, (err, row) => {
    req.db.close()
    if (err) {
      res.send({success: false, message: err.message})
    }
    if (row.result.n === 0) {
      return res.send({success: false, message: 'Collection ID was not found.'})
    }
    res.send({success: true, message: 'Collection has been removed.'})
  })
})

// Export router
module.exports = router
