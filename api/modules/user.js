/* global require db */
const Express = require('express')
const app = Express()

app.get('/', async function (req, res) {
  try {
    const result = await db.any('SELECT * FROM "user"')
    res.json(result)
  } catch (error) {
    console.error(error)
    res.status(500).send(error.message)
  }
})

app.get('/:username', async function (req, res) {
  try {
    const username = req.params.username
    const result = await db.any('SELECT * FROM "user" WHERE username=$1', username)
    res.json(result)
  } catch (error) {
    console.error(error)
    res.status(500).send(error.message)
  }
})

app.post('/', async function (req, res) {
  try {
    const param = req.body
    await db.none('INSERT INTO "user" (username, password, email, screenName) VALUES ($1, digest($2, \'sha512\'), $3, $4)', [param.username, param.password, param.email, param.screenName])
    res.send()
  } catch (error) {
    console.error(error)
    res.status(500).send(error.message)
  }
})

app.post('/:username', async function (req, res) {
  try {
    const username = req.params.username
    const param = req.body

    await db.tx(t => {
      var query = []
      if (req.body.password !== undefined)
        query.push(t.none('UPDATE "user" SET password=digest($2, \'sha512\') WHERE username=$1', [username, param.password]))
      if (req.body.email !== undefined)
        query.push(t.none('UPDATE "user" SET email=$2 WHERE username=$1', [username, param.email]))
      if (req.body.screenName !== undefined)
        query.push(t.none('UPDATE "user" SET screenName=$2 WHERE username=$1', [username, param.screenName]))
      return t.batch(query)
    })

    res.send()
  } catch (error) {
    console.error(error)
    res.status(500).send(error.message)
  }
})

app.delete('/:username', async function (req, res) {
  try {
    const username = req.params.username
    await db.none('DELETE FROM "user" WHERE username=$1', username)
    res.send()
  } catch (error) {
    console.error(error)
    res.status(500).send(error.message)
  }
})

module.exports = app
