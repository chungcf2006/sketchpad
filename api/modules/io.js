module.exports = function (server) {
  const io = require('socket.io')(server)
  const redis = require('then-redis')
  const redisClient = redis.createClient()

  io.on('connection', function (socket) {
    const sketchpadID = socket.handshake.query.sketchpadID
    var username
    socket.join(sketchpadID)
    socket.on('new_stroke', function (data) {
      redisClient.rpush(`${sketchpadID}:uncommited`, JSON.stringify({type: 'draw', data: data}))
      io.to(sketchpadID).emit('draw', data)
    })
    socket.on('geometry_start', function (data) {
      redisClient.rpush(`${sketchpadID}:uncommited`, JSON.stringify({type: 'start_save', data: data}))
      io.to(sketchpadID).emit('geometry_start', data)
    })
    socket.on('clear_canvas', function () {
      io.to(sketchpadID).emit('clear')
    })
    socket.on('save', function () {
      io.to(sketchpadID).emit('save')
    })
    socket.on('update_pen', function (data) {
      if (username === undefined) {
        username = data.username
      }
      redisClient.hset(`${sketchpadID}:${data.username}:pen`, 'dia', data.pen.dia)
      redisClient.hset(`${sketchpadID}:${data.username}:pen`, 'r', data.pen.r)
      redisClient.hset(`${sketchpadID}:${data.username}:pen`, 'g', data.pen.g)
      redisClient.hset(`${sketchpadID}:${data.username}:pen`, 'b', data.pen.b)
      redisClient.hset(`${sketchpadID}:${data.username}:pen`, 'a', data.pen.a)
      io.to(sketchpadID).emit('display_update_pen', data)
    })
    socket.on('disconnect', async function () {
      if (username !== undefined) {
        redisClient.srem(`${sketchpadID}:userlist`, username)
        const list = await redisClient.keys(`${sketchpadID}:${username}:*`)
        list.forEach(key => {
          redisClient.del(key)
        })
        io.to(sketchpadID).emit('member_list')
      }
    })
  })

  return io
}
