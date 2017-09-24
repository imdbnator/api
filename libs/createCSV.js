const json2csv = require('json2csv')
const fs = require('fs')
const entries = require('../samples/populatedCollection').entries
const fields = ['id', 'imdbid', 'tmdbid', 'title', 'year', 'runtime', 'country', 'genre', 'language', 'rating', 'votes', 'awards', 'cast', 'director', 'plot', 'poster']
const data = []

for (let i = 0; i < entries.length; i++) {
  const csvEntry = {}
  const entry = entries[i]

  for (let j = 0; j < fields.length; j++) {
    const field = fields[j]
    if (field in entry['info']) {
      let content = entry['info'][field]
      switch (field) {
        case 'cast':
        case 'crew':
        case 'collection':
          content = content.map(a => a.name).join(', ')
          break
        default:
      }
      csvEntry[field] = content
    }
  }

  data.push(csvEntry)
}

const csv = json2csv({ data, fields })

fs.writeFile('file.csv', csv, function (err) {
  if (err) throw err
  console.log('file saved')
})
