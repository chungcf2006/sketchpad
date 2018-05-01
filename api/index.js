/* global require global */

const Express = require('express')
const app = Express()
const bodyParser = require('body-parser')

global.pgp = require('pg-promise')();
global.db = global.pgp({
  host: 'localhost',
  port: 5432,
  database: 'sketchpad',
  user: 'sketchpad',
  password: 'sketchpad'
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', function (req, res) {
  res.send('hi')
})


app.use('/users', require('./modules/user.js'))

app.listen(8081)
