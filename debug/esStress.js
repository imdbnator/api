const Promise = require('bluebird');
const ElasticSearch = require('../libs/ElasticSearch')
const esClient = new ElasticSearch({index: 'tmdb', type: 'movie', mode: 'match'})

Promise.map([...Array(1000).keys()], (job,i) => {
  return new Promise((resolve, reject) => {
    esClient.matchSearch({title: 'Donnie Darko'}, (result) => {
      console.log(result.success, result.elasticsearch.took, result.elasticsearch.hits[0]._source.title)
      if (!result.success) reject({job, result})
      resolve({job, result})
    })
  })
}
, {concurrency: 3})
.then(() => {
  console.log("done")
}).catch(() => {
  console.log("error")
})



// const max = 100
//
// var promises = [...Array(10).keys()].map((job) => {
//   return new Promise((resolve, reject) => {
//     esClient.matchSearch({title: 'Donnie Darko'}, (result) => {
//       if (!result.success) reject({job, result})
//       resolve({job, result})
//     })
//   })
// })
//
// let done = 0
// Promise.resolve(promises)
// .then(({job, result}) => {
//   console.log(`Job ${job}`, result)
//   done++
//   if (done > max) return
//   promises[job] = new Promise((resolve, reject) => {
//     esClient.matchSearch({title: 'Donnie Darko'}, (result) => {
//       console.log('Promise done:', job)
//       if (!result.success) reject({job, result})
//       resolve({job, result})
//     })
//   })
// })

// esProm
// new Promise((resolve, reject) => {
//   esClient.matchSearch({title: 'Donnie Darko'}, (result) => {
//     console.log(result)
//     if (!result.success) reject(result)
//     resolve(resolve)
//   })
// })
