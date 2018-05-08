/* global require */
const Express = require('express')
const path = require('path')
const multer = require('multer')
const fs = require('fs')
const upload = multer({ storage: multer.memoryStorage() })
const redis = require('redis')
const redisClient = redis.createClient()
const app = Express()

app.get('/:sketchpadID', function (req, res) {
  res.type('png').sendFile(path.resolve('../sketchpads', req.params.sketchpadID))
})

app.post('/:sketchpadID', upload.single('sketchpad'), function (req, res) {
  try {
    fs.writeFile(path.resolve('../sketchpads', req.params.sketchpadID), req.file.buffer, function (error) {
      if (error) {
        throw error
      }
      res.end()
    })
  } catch (error) {
    console.error(error)
    res.status(500).send(error.message)
  }
})

app.post('/:sketchpadID/login', function (req, res) {
  const sketchpadID = req.params.sketchpadID
  redisClient.sadd(`userlist_${sketchpadID}`, req.body.username)
  res.end()
})

app.post('/:sketchpadID/logout', function (req, res) {
  const sketchpadID = req.params.sketchpadID
  redisClient.srem(`userlist_${sketchpadID}`, req.body.username)
  res.end()
})

app.get('/:sketchpadID/memberList', function (req, res) {
  const sketchpadID = req.params.sketchpadID
  redisClient.smembers(`userlist_${sketchpadID}`, function (err, results) {
    res.json(results)
  })
})



module.exports = app
