/* global require */
const Express = require('express')
const path = require('path')
const multer = require('multer')
const fs = require('fs')
const upload = multer({ storage: multer.memoryStorage() })
const redis = require('then-redis')
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

app.post('/:sketchpadID/members/:username', async function (req, res) {
  const sketchpadID = req.params.sketchpadID
  const isMember = await redisClient.sismember(`${sketchpadID}:userlist`, req.params.username)
  if (!isMember) {
    redisClient.sadd(`${sketchpadID}:userlist`, req.params.username)
    res.end()
  } else {
    res.status(401).send('Username already exist')
  }
})

app.delete('/:sketchpadID/members/:username', function (req, res) {
  const sketchpadID = req.params.sketchpadID
  redisClient.srem(`${sketchpadID}:userlist`, req.params.username)
  res.end()
})

app.get('/:sketchpadID/members', async function (req, res) {
  const sketchpadID = req.params.sketchpadID
  var list = await redisClient.smembers(`${sketchpadID}:userlist`)
  list = await Promise.all(list.map(async result => {
    const pen = await redisClient.hgetall(`${sketchpadID}:${result}:pen`)
    return {username: result, pen: pen}
  }))
  res.json(list)
})



module.exports = app
