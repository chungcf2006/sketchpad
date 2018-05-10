module.exports = function (server) {
  const io = require('socket.io')(server)
  const redis = require('then-redis')
  const redisClient = redis.createClient()

  io.on('connection', function (socket) {
    const sketchpadID = socket.handshake.query.sketchpadID
    socket.join(sketchpadID)
    socket.on('new_stroke', function (data) {
      io.to(sketchpadID).emit('draw', data)
    })
    socket.on('update_pen', function (data) {
      redisClient.hset(`${sketchpadID}:${data.username}:pen`, 'dia', data.pen.dia)
      redisClient.hset(`${sketchpadID}:${data.username}:pen`, 'r', data.pen.r)
      redisClient.hset(`${sketchpadID}:${data.username}:pen`, 'g', data.pen.g)
      redisClient.hset(`${sketchpadID}:${data.username}:pen`, 'b', data.pen.b)
      redisClient.hset(`${sketchpadID}:${data.username}:pen`, 'a', data.pen.a)
      io.to(sketchpadID).emit('display_update_pen', data)
    })
  })

  return io
}
