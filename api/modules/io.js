module.exports = function (server) {
  const io = require('socket.io')(server)

  io.on('connection', function (socket) {
    const sketchpadID = socket.handshake.query.sketchpadID
    socket.join(sketchpadID)
    socket.on('new_stroke', function (data) {
      io.to(sketchpadID).emit('draw', data)
    })
    socket.on('update_pen', function (data) {
      console.log(data)
      io.to(sketchpadID).emit('display_update_pen', data)
    })
  })

  return io
}
