/* global require global */

const Express = require('express')
const app = Express()
const server = require('http').Server(app)
const bodyParser = require('body-parser')
const morgan = require('morgan')

global.pgp = require('pg-promise')();
global.db = global.pgp({
  host: 'localhost',
  port: 5432,
  database: 'sketchpad',
  user: 'sketchpad',
  password: 'sketchpad'
})
global.io = require('./modules/io')(server)

app.use(morgan('dev'))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/', function (req, res, next) {
  if (req.url.startsWith('/api')) {
    req.url = req.url.substring(4)
  }
  next()
})

app.use('/users', require('./modules/user.js'))
app.use('/sketchpads', require('./modules/sketchpad.js'))

server.listen(8081)
