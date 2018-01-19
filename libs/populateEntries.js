/*
Bugs:
  - Using a hacky way of cloing object since cloneDeep or Object.assign doesnt seem to work when calling the function from the API route.
  - Need to make sure to populate all entries. Or else some fields are missing on the client. Which is bad. The client should receive all the details from the server
  - To make sure entriesare populated in source order with some good logical constraints.
  - The collections migrated from old server seem to put all movies under duplicates of 1 title.
 */

const MongoClient = require('mongodb').MongoClient
const Promise = require('bluebird')
const _ = require('lodash');
const host = require('../configs').mongodb

// Configs
const config = require('../configs/mongo.json')

// My modules
const parseDoc = require('./parseDoc')

function populateEntries (oldEntries, sources, done) {
  // These are not working!
  // let entries = _.cloneDeep(oldEntries)
  // let entries = Object.assign({}, oldEntries)
  let entries = JSON.parse(JSON.stringify(oldEntries))

  // Maps imdbid to entryid
  const imdb2entry = {}
  for (let i = 0; i < entries.length; i++) {
    const { modified, search, ignore } = entries[i]
    if (!search.found && !modified) continue
    if (ignore) continue

    const imdbid = (modified) ? modified : search.result.imdbid

    if (imdbid in imdb2entry) imdb2entry[imdbid].push(i)
    if (!(imdbid in imdb2entry)) imdb2entry[imdbid] = [i]
  }

  // Initially populate all entries
  for (let i = 0; i < entries.length; i++) {
    entries[i]['info'] = {'_sources': []}
  }

  // Connect to monge
  return new Promise((mainResolve, mainReject) => {
    return MongoClient.connect(`mongodb://${host}/imdbnator`, {promiseLibrary: Promise})
    .then((db) => {
      Promise.map(sources, (source, i) => {
        return new Promise((mapperResolve, mapperReject) => {
          const fieldMap = config.collections[source].fields
          db.collection(config.collections[source].name)
          .find({[fieldMap.imdbid]: {$in: Object.keys(imdb2entry)}})
          .toArray()
          .then((docs) => {
            // Fill entryies with docs using imdb2entry
            for (let k = 0; k < docs.length; k++) {
              const newDoc = parseDoc(source, docs[k])
              const imdbid = newDoc.imdbid // (CRITICAL): Using imdbid to identify a collection's entry. This WILL break if no imdbid exists in a document.
              const entryids = imdb2entry[imdbid]
              for (let j = 0; j < entryids.length; j++) {
                let info = entries[entryids[j]]['info'] // (CRITICAL): Using the fact that entryid is the same as its index in array. Can be breaking.
                info = Object.assign(info, newDoc)
                info['_sources'].push(source)
              }
            }
            mapperResolve()
            return
          })
          .catch(err => {
            console.log('(MongoDB): Unable to retrieve document:', err.message)
            mapperReject(err)
          })

        })
      }, {concurrency: 3})
      .then(() => {
        mainResolve(entries)
        db.close()
      })
      // .catch(err => {
      //    console.log('(MongoDB):  Promise queue has failed:', err.message)
      //    mainReject(err)
      //    db.close()
      //    return
      //  })
    })
    .catch(err => {
      console.log('(MongoDB): Unable to connect to mongodb:', err.message)
      mainReject(err)
      db.close()
     })
    })
}

module.exports = populateEntries

if (process.env.DEBUG){
  const argv = require('minimist')(process.argv.slice(2));
  const source = argv['s']
  const mockEntries = require('../samples/collectionEntries')
  populateEntries(mockEntries,['imdb', 'tmdb'])
  .then(function(entries){
    console.log(JSON.stringify(entries))
  })
  .catch(err => console.log(err.message))
}
