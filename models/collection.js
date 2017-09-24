'use strict'
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const validator = require('validator')
const shortid = require('shortid')
const _ = require('lodash')
const Schema = mongoose.Schema

// Define an Entry's scehma
const entrySchema = new Schema({
  entryid: {
    type: Number,
    default: 0,
    required: true
  },
  input: {
    hash: {
      type: Number,
      maxlength: [100, "Input's hash cannot be more than 100 characters."],
      required: [true, "Input's hash is required."]
    },
    name: {
      type: String,
      maxlength: [1000, "Input's name cannot be more than 1000 characters."],
      required: [true, "Input's name is required."]
    },
    path: {
      type: String,
      maxlength: [1000, "Input's path cannot be more than 1000 characters."],
      default: null
    },
    size: {
      type: Number,
      maxlength: [100, "Input's size cannot be more than 100 characters."],
      default: 0
    },
    type: {
      type: String,
      maxlength: [100, "Input's type cannot be more than 100 characters."],
      default: null
    }
  },
  guesser: {
    found: {
      type: Boolean,
      default: false
    },
    engine: {
      type: String,
      enum: {
        values: ['py', 'js'],
        message: "Guesser's engine can either be 'py' or 'js'."
      },
      default: 'js'
    },
    guess: {
      type: Object,
      default: {}
    }
  },
  search: {
    found: {
      type: Boolean,
      default: false
    },
    ranking: {
      type: String,
      enum: {
        values: ['match', 'prefix'],
        message: 'Search ranking can either be "match" or "prefix".'
      },
      default: 'match'
    },
    result: {
      imdbid: {
        type: Schema.Types.Mixed,
        validate: {
          isAsync: true,
          validator: function (value) {
            return /tt\d{7}/.test(value) || value === null
          },
          message: "'{VALUE}' is not a valid IMDb ID for result."
        },
        default: null
      },
      tmdbid: {
        type: Schema.Types.Mixed,
        validate: {
          isAsync: true,
          validator: function (value) {
            return /\d{7}/.test(value) || value === null
          },
          message: "'{VALUE}' is not a valid TMDb ID for result."
        },
        default: null
      },
      type: {
        type: Schema.Types.Mixed,
        validate: {
          isAsync: true,
          validator: function (value) {
            return _.includes(['movie', 'tv', 'episode'], value) || value === null
          },
          message: "'{VALUE}' is not a valid result type."
        },
        default: null
      }
    }
  },
  modified: {
    type: Schema.Types.Mixed,
    validate: {
      isAsync: true,
      validator: function (value) {
        return /tt\d{7}/.test(value) || value === false
      },
      message: "'{VALUE}' is not a valid IMDb ID at modified."
    },
    default: false
  },
  ignore: {
    type: Boolean,
    default: false
  }
}, {minimize: false})

// Define Collection's schema
const collectionSchema = new Schema({
  id: {
    type: String,
    validate: {
      isAsync: true,
      validator: function (value) {
        return /^[a-zA-Z0-9_-]*$/.test(value) || shortid.isValid(value)
      },
      message: 'ID can only be alphanumeric with special characters "-" or "_"'
    },
    minlength: [2, 'Collection ID cannot be less than 2 characters.'],
    maxlength: [32, 'Collection ID cannot be more than 32 characters.'],
    trim: true,
    required: [true, 'Collection ID is required.'],
    index: true,
    unique: true
  },
  hash: {
    type: String,
    minlength: [32, 'Collection hash must have a length of 32.'],
    maxlength: [32, 'Collection hash must have a length of 32.'],
    required: [true, 'Collection hash is required.']
  },
  type: {
    type: String,
    enum: {
      values: ['pc', 'web', 'text'],
      message: 'Collection type can either be "pc","web" or "text".'
    },
    required: [true, 'Collection type is required.']
  },
  entries: {
    type: [entrySchema],
    required: [true, 'Entries cannot be empty.']
  },
  misc: {
    lines: {
      type: String,
      validate: {
        isAsync: true,
        validator: function (value) {
          return (_.isNull(value) || _.includes(['all','scene'], value))
        },
        message: 'Collection subtype can either be "all"or "scene".'
      },
      default: null
    },
    url: {
      type: String,
      validate: {
        isAsync: true,
        validator: function (value) {
          if (_.isNull(value)) return true
          return validator.isURL(value)
        },
        message: '"{VALUE}" is an invalid url.'
      },
      maxlength: [400, 'Website URL cannot be more than 400 characters.'],
      trim: true,
      default: null
    },
    pc: {
      type: String,
      maxlength: [400, 'PC info cannot be more than 400 characters.'],
      trim: true,
      default: null
    }
  },
  settings: {
    name: {
      type: String,
      maxlength: [50, 'Collection name cannot be more than 50 characters.'],
      trim: true,
      default: null
    },
    description: {
      type: String,
      maxlength: [200, 'Collection description cannot be more than 200 characters.'],
      trim: true,
      default: null
    },
    private: {
      type: Boolean,
      default: false
    }
  },
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date,
    default: Date.now
  },
  processed: {
    type: Boolean,
    default: false
  },
  version: {
    type: Number,
    default: 1.0
  }
}, {minimize: false})

// Custom plugin to change `unique` to validation error and message
collectionSchema.plugin(uniqueValidator, {
  message: 'Collection {PATH} is already taken! Please choose another.'
})

const Collection = mongoose.model('Collection', collectionSchema)
module.exports = Collection

// Example document
// {
//   "id": sl01,
//   "hash": "4d32b24aa9b299c285b3c35107353fa8",
//   "type": "pc",
  // "entry": [{
  //   "id": 10,
  //   "input": {
  //     "name": "Firefox_wallpaper.png",
  //     "path": "Wallpapers/Firefox_wallpaper.png",
  //     "size": 2185305
  //   },
  //   "search": {
  //     "found": true,
  //     "results": [{
  //       "imdb_title": "The Pursuit of Happyness",
  //       "distance": 0,
  //       "imdb_votes": 340756,
  //       "imdb_id": "tt0454921"
  //     }]
  //   },
  //   "guesser": {
  //     "found": true,
  //     "engine": "js",
  //     "guess": {
  //       "input": "The Pursuit of Happyness (2006)",
  //       "year": 2006,
  //       "type": "movie",
  //       "title": "The Pursuit of Happyness"
  //     }
  //   },
  //   "modified": "tt0119177",
  //   "ignore": false
  // }],
//   "misc": {
//     "lines": "pc",
//     "url": "https://rottentomatoes.com/top/bestofrt/?year=2015",
//     "pc": "Windows 10"
//   },
//   "settings": {
//     "name": "sl01",
//     "description": "This is an awesome list",
//     "private": "as"
//   }
// }
