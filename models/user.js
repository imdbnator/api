'use strict'
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const Schema = mongoose.Schema

// Todo
// Add email validation
// Autoincrement ID
// Fix toUpperCase(). Its not working.

const userSchema = new Schema({
  // id: {
  //   type: String,
  //   unique: true
  // },
  username: {
    type: String,
    minlength: [3, 'Username cannot be less than 3 characters.'],
    maxlength: [20, 'Username cannot be more than 20 characters.'],
    required: [true, 'Username is required.'],
    lowercase: true,
    unique: true
  },
  password: {
    type: String,
    minlength: [32, 'Password hash must be 32 characters.'],
    maxlength: [32, 'Password hash must be 32 characters.'],
    required: [true, 'Password is required.']
  },
  email: {
    type: String,
    required: [true, 'Email ID is required.'],
    unique: true
  },
  name: {
    type: String,
    maxlength: [100, 'Name cannot be less than 100 characters.'],
    default: null
  },
  activated: {
    type: Boolean,
    default: false
  },
  created: {
    type: Date,
    default: Date.now
  },
  last_active: {
    type: Date,
    default: Date.now
  }
})

userSchema.plugin(uniqueValidator, {
  message: '{PATH}'.toUpperCase() + ' is already taken! Please choose another.'
})

const User = mongoose.model('User', userSchema)
module.exports = User
