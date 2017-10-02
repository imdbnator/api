function cors (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT')
  res.header('Access-Control-Allow-Credentials', 'true')
  next()
}

module.exports = cors
