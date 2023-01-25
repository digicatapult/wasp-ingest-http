import express from 'express'
import bodyParser from 'body-parser'
import pinoHttp from 'pino-http'

import env from './env.js'
import logger from './logger.js'
import parseBody from './parser.js'
import setupForward from './forwarder.js'

const { PORT, WASP_INGEST_NAME } = env

async function createHttpServer() {
  const forward = await setupForward()
  const app = express()
  const requestLogger = pinoHttp({ logger })

  app.use((req, res, next) => {
    if (req.path !== '/health') requestLogger(req, res)
    next()
  })

  app.get('/health', async (req, res) => {
    res.status(200).send({ status: 'ok' })
  })

  app.use(bodyParser.json({ type: 'application/json' }))
  app.post(`/v1/ingest/${WASP_INGEST_NAME}/message`, async (req, res) => {
    const body = req.body
    // check we have a body that is not falsey and is an object or array
    if (!body || typeof body !== 'object') {
      logger.warn(`Invalid message body or headers received`)
      res.status(400).send(`Invalid message body or headers received`)
      return
    }

    let payload = null
    try {
      payload = parseBody(body)
    } catch (err) {
      logger.warn(`Error parsing body ${err.message || err}`)
      res.status(400).send(`Invalid message body`)
      return
    }

    await forward(payload)
    // check headers haven't been sent automatically while the async next was running.
    // assuming they haven't send a response
    if (!res.headersSent) {
      res.status(202).send()
    }
  })

  // Sorry - app.use checks arity
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.status) {
      res.status(err.status).send({ error: err.status === 401 ? 'Unauthorised' : err.message })
    } else {
      logger.error('Fallback Error %j', err.stack)
      res.status(500).send('Fatal error!')
    }
  })

  return { app }
}

/* istanbul ignore next */
async function startServer() {
  try {
    const { app } = await createHttpServer()

    const setupGracefulExit = ({ sigName, server, exitCode }) => {
      process.on(sigName, async () => {
        server.close(() => {
          process.exit(exitCode)
        })
      })
    }

    const server = await new Promise((resolve, reject) => {
      let resolved = false
      const server = app.listen(PORT, (err) => {
        if (err) {
          if (!resolved) {
            resolved = true
            reject(err)
          }
        }
        logger.info(`Listening on port ${PORT} `)
        if (!resolved) {
          resolved = true
          resolve(server)
        }
      })
      server.on('error', (err) => {
        if (!resolved) {
          resolved = true
          reject(err)
        }
      })
    })

    setupGracefulExit({ sigName: 'SIGINT', server, exitCode: 0 })
    setupGracefulExit({ sigName: 'SIGTERM', server, exitCode: 143 })
  } catch (err) {
    logger.fatal('Fatal error during initialisation: %j', err)
    process.exit(1)
  }
}

export { startServer, createHttpServer }
