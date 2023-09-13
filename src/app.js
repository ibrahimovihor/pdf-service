
import express from 'express'
import cors from 'cors'
import logger from 'morgan'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import path from 'path'
import joiErrors from './middlewares/joiErrors'

import * as statusCodes from './constants/statusCodes'

import routers from './routes'

dotenv.config()

const apiPrefix = '/api'

// Set up the express app
const app = express()

// Configure cors
app.use(cors())

// Log request to the console
app.use(logger('dev'))

// Parse incoming requests data
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Add routes to the app
app.use(apiPrefix, routers.emailRouter())
app.use(apiPrefix, routers.greetingCardRouter())

// Add validation middleware
app.use(joiErrors)

app.get('/', (req, res) => res.status(200).send({
  message: 'Welcome to the beginning of insanity',
  api_docs: 'Add postman link here'
}))

app.get('/styles', (req, res) => {
  const options = {
    root: path.join(__dirname, 'public', 'styles'),
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  }
  const fileName = 'index.css'
  res.status(statusCodes.OK).sendFile(fileName, options)
})

// Return 404 for nonexistent routes
app.use((req, res) => res.status(statusCodes.NOT_FOUND).send({
  statusCode: statusCodes.NOT_FOUND,
  success: false,
  errors: {
    message: 'Route not found'
  }
}))

export default app
