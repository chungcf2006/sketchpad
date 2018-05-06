/* global require db */
const Express = require('express')
const path = require('path')
const app = Express()

app.get('/:sketchpadID', function (req, res) {
  res.type('png').sendfile(path.resolve('../sketchpads', req.params.sketchpadID))
})

module.exports = app
