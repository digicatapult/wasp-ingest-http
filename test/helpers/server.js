const request = require('supertest')
const { before } = require('mocha')

const { createHttpServer } = require('../../app/server')

let server = null
const setupServer = async (context) => {
  before(async function () {
    this.timeout(10000)
    if (!server) {
      server = await createHttpServer()
    }
    context.request = request(server.app)
  })
}

module.exports = { setupServer }
