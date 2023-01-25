import request from 'supertest'
import { before } from 'mocha'

import { createHttpServer } from '../../app/server.js'

let server = null
export const setupServer = async (context) => {
  before(async function () {
    this.timeout(10000)
    if (!server) {
      server = await createHttpServer()
    }
    context.request = request(server.app)
  })
}
