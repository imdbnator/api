const express = require('express')
const router = express.Router()

router.get('/echo/:input', (req, res) => {
  res.send({success: true, response: (req.params.input) ? (req.params.input) : null})
})

module.exports = router
