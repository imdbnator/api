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
const path = require('path');
const express = require('express')
const compression = require('compression');
const ejs = require('ejs');
const api = express()
const config = require('./configs');
const port = config.port
const maxListeners = config.maxListeners

// Increase max event listeners.
process.setMaxListeners(maxListeners)

// Global Middleware
api.use(compression({level: 9}))

// Set config
api.set('views', __dirname + '/views')
api.engine('html', require('ejs').renderFile);

// Define REST Routes
api.use('/debug', require('./routes/debug'))
api.use('/collection', require('./routes/collection'))
api.use('/user', require('./routes/user'))
api.use('/process', require('./routes/process'))

// Start REST API on specified port
const server = api.listen(port, function () {
  console.log(`Server listening to ${config.web} on ${config.port}.
===============
${JSON.stringify(config)}
===============`)
})

// Start Daemon
const startDaemon = require('./daemon')
startDaemon(server)
