/*
Todo:
  - Prevent MySQL injection
  - Prevent Client side updates
  - Change empty string to be stored as NULL in MySQL DB
  - Custom ID not automatically setting when calling shortid!
  - Close connection when the user abrutly interupt or timesout.
  - Add authentication and autherization
  - Write a universal function for handling error instead of dealing with them everytime
  - Use router to separate user, collection APIs
  - Add authentication for user creation methods.
  - Add timeout to API.
  - Handle empty requests and wrong requests types
  - Create a separate route for processing daemon instead of having it here.
 */

'use strict'
const express = require('express')
const compression = require('compression');
const api = express()
const port = process.env.PORT || 80

// Increase max event listeners.
process.setMaxListeners(30)

// Global Middleware
api.use(compression({level: 9}))

// Define REST Routes
api.use('/debug', require('./routes/debug'))
api.use('/collection', require('./routes/collection'))
api.use('/user', require('./routes/user'))
api.use('/process', require('./routes/process'))

// Start REST API on specified port
const server = api.listen(port, function () { console.log('Server listening on port: %s', port) })

// Start Daemon
const startDaemon = require('./daemon')
startDaemon(server)
