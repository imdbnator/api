const remote = process.env.REMOTE || '*'

function cors (req, res, next) {
  res.header('Access-Control-Allow-Origin', remote)
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PURGE')
  res.header('Access-Control-Allow-Credentials', 'true')
  next()
}

module.exports = cors
