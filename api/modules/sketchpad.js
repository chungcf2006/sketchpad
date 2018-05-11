/* global require io */
const Express = require('express')
const path = require('path')
const multer = require('multer')
const fs = require('fs')
const upload = multer({ storage: multer.memoryStorage() })
const redis = require('then-redis')
const redisClient = redis.createClient()
const app = Express()

app.get('/:sketchpadID', async function (req, res) {
  const sketchpadID = req.params.sketchpadID
  if (await redisClient.sismember('sketchpads', sketchpadID)) {
    res.end()
  } else {
    res.status(404).end()
  }
})

app.post('/:sketchpadID', async function (req, res) {
  const sketchpadID = req.params.sketchpadID
  if (await redisClient.sismember('sketchpads', sketchpadID)) {
    res.status(401).end()
  } else {
    redisClient.sadd('sketchpads', sketchpadID)
    res.end()
  }
})

app.get('/:sketchpadID/uncommited', async function (req, res) {
  const sketchpadID = req.params.sketchpadID
  var list = await redisClient.lrange(`${sketchpadID}:uncommited`, 0, -1)
  list = list.map(entry => JSON.parse(entry))
  res.json(list)
})

app.get('/:sketchpadID/image', function (req, res) {
  res.type('png').sendFile(path.resolve('../sketchpads', req.params.sketchpadID))
})

app.post('/:sketchpadID/image', upload.single('sketchpad'), function (req, res) {
  try {
    const sketchpadID = req.params.sketchpadID
    fs.writeFile(path.resolve('../sketchpads', req.params.sketchpadID), req.file.buffer, function (error) {
      if (error) {
        throw error
      }
      redisClient.del(`${sketchpadID}:uncommited`)
      res.end()
    })
  } catch (error) {
    console.error(error)
    res.status(500).send(error.message)
  }
})

app.post('/:sketchpadID/members/:username', async function (req, res) {
  const sketchpadID = req.params.sketchpadID

  if (!req.params.username.match(/\w+/g)) {
    return res.status(400).send('Bad Username')
  }
  //
  // const isMember = await redisClient.sismember(`${sketchpadID}:userlist`, req.params.username)
  // if (!isMember) {
    redisClient.sadd(`${sketchpadID}:userlist`, req.params.username)
    io.to(req.params.sketchpadID).emit('member_list')
    res.end()
  // } else {
  //   res.status(401).send('Username already exist')
  // }
})

app.delete('/:sketchpadID/members/:username', async function (req, res) {
  const sketchpadID = req.params.sketchpadID
  redisClient.srem(`${sketchpadID}:userlist`, req.params.username)
  const list = await redisClient.keys(`${sketchpadID}:${req.params.username}:*`)
  list.forEach(key => {
    redisClient.del(key)
  })
  io.to(sketchpadID).emit('member_list')
  const memberCount = await redisClient.scard(`${sketchpadID}:userlist`)
  if (memberCount === 0) {
    redisClient.del(`${sketchpadID}:userlist`)
    redisClient.srem(`sketchpads`, sketchpadID)
  }
  res.end()
})

app.get('/:sketchpadID/members', async function (req, res) {
  const sketchpadID = req.params.sketchpadID
  var list = await redisClient.smembers(`${sketchpadID}:userlist`)
  list = await Promise.all(list.map(async result => {
    var pen = await redisClient.hgetall(`${sketchpadID}:${result}:pen`)
    if (pen !== null) {
      pen.r = parseInt(pen.r)
      pen.g = parseInt(pen.g)
      pen.b = parseInt(pen.b)
      pen.a = parseInt(pen.a)
      pen.dia = parseInt(pen.dia)
    }
    return {username: result, pen: pen}
  }))
  res.json(list)
})



module.exports = app
