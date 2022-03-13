//import {basicSearch} from './esConfig'
const express = require('express')
const cors = require('cors')
const app = express()
require('dotenv').config()
const {
  searchBasicFunc,
  searchShinglesAndExact,
  searchAdvanced,
  searchWithSynonyms,
  registerUserId,
  addDiscourse,
  getUserObject,
  removeDiscourse,
  getAllDiscourseFromBookmarkArray,
  getLoginId,
  addTag,
  removeTag,
  addDiscourseToTag,
  removeDiscourseFromTag,
} = require('./esConfig')

app.use(cors())
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true }))
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(process.env.APP_PORT || 8080, () => {
  console.log(`Example app listening on port `)
})

app.post('/searchAdvanced', (req, res) => {
  console.log('req received for discourse Index')
  const response = searchAdvanced(req.body.searchQuery)
  response.then((result) => {
    res.send(result)
  })
})
app.post('/searchExactAndShingles', (req, res) => {
  console.log('req received for shingles')
  const response = searchShinglesAndExact(req.body.searchQuery)
  response.then((result) => {
    res.send(result)
  })
})

app.post('/searchWithSynonym', (req, res) => {
  console.log('req received for searchWithSynonym')
  console.log(req.body.advancedSettings)
  const response = searchWithSynonyms(
    req.body.searchQuery,
    req.body.advancedSettings,
  )
  response.then((result) => {
    res.send(result)
  })
})
app.post('/registerUser', (req, res) => {
  console.log('req received for registerUser ' + req.body.userName)
  const response = registerUserId(req.body.userName)
  response.then((result) => {
    res.send(result)
  })
})
app.post('/addDiscourse', (req, res) => {
  console.log('req received for registerUser ' + req.body.userId)
  const response = addDiscourse(req.body.userId, req.body.discourseId)
  response.then((result) => {
    res.send(result)
  })
})
app.post('/removeDiscourse', (req, res) => {
  console.log('req received for registerUser ' + req.body.userId)
  const response = removeDiscourse(req.body.userId, req.body.discourseId)
  response.then((result) => {
    res.send(result)
  })
})

app.post('/getUserObject', (req, res) => {
  console.log('req received for getUserObject ' + req.body.userId)
  const response = getUserObject(req.body.userId)
  response.then((result) => {
    res.send(result)
  })
})
app.post('/getBookmarkDiscourses', (req, res) => {
  console.log('req received for getUserObject ' + req.body.bookmarkArray)
  const response = getAllDiscourseFromBookmarkArray(req.body.bookmarkArray)
  response.then((result) => {
    res.send(result)
  })
})

app.post('/getLoginId', (req, res) => {
  console.log('req received for getLoginId ' + req.body.userName)
  const response = getLoginId(req.body.userName)
  response.then((result) => {
    res.send(result)
  })
})

app.post('/addTag', (req, res) => {
  console.log('req.body.tagName ' + req.body.tagName)
  const response = addTag(req.body.userId, req.body.tagName)
  response.then((result) => {
    res.send(result)
  })
})

app.post('/removeTag', (req, res) => {
  console.log('req.body.tagName ' + req.body.tagName)
  const response = removeTag(req.body.userId, req.body.tagName)
  response.then((result) => {
    res.send(result)
  })
})
app.post('/addDiscourseToTag', (req, res) => {
  console.log('req.body.tagName ' + req.body.tagName)
  const response = addDiscourseToTag(
    req.body.userId,
    req.body.tagName,
    req.body.discourseId,
  )
  response.then((result) => {
    res.send(result)
  })
})

app.post('/removeDiscourseFromTag', (req, res) => {
  console.log('req.body.tagName ' + req.body.tagName)
  const response = removeDiscourseFromTag(
    req.body.userId,
    req.body.tagName,
    req.body.discourseId,
  )
  response.then((result) => {
    res.send(result)
  })
})
