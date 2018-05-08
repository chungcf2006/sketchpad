/* global require global */

const Express = require('express')
const app = Express()
const server = require('http').Server(app)
const bodyParser = require('body-parser')

global.pgp = require('pg-promise')();
global.db = global.pgp({
  host: 'localhost',
  port: 5432,
  database: 'sketchpad',
  user: 'sketchpad',
  password: 'sketchpad'
})

const io = require('socket.io')(server);

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', function (req, res) {
  res.send('hi')
})


app.use('/users', require('./modules/user.js'))
app.use('/sketchpads', require('./modules/sketchpad.js'))

io.on('connection', function (socket) {
  const sketchpadID = socket.handshake.query.sketchpadID
  socket.join(sketchpadID)
  socket.on('new_stroke', function (data) {
    console.log(data)
    io.to(sketchpadID).emit('draw', data)
  })
})

server.listen(8081)
