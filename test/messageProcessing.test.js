const { describe, before, after, it } = require('mocha')
const { expect } = require('chai')

const { setupServer } = require('./helpers/server')

const createSub = require('./helpers/sub')

const env = require('../app/env')

describe('Message Processing', function () {
  const context = {}
  let sub = null
  setupServer(context)

  before(async function () {
    this.timeout(40000)
    sub = await createSub()
  })

  after(async function () {
    this.timeout(5000)
    await sub.disconnect()
  })

  describe('happy path', function () {
    let messages = null
    before(async function () {
      sub.resetMessages()
      context.response = await context.request
        .post(`/${env.API_MAJOR_VERSION}/ingest/${env.WASP_INGEST_NAME}/message`)
        .send({ id: '574bd77c-4aba-4557-aa9e-066939f938cc', answer: 42 })

      messages = await sub.waitForMessages({ expectedMessages: 1 })
    })

    it('should respond with http 202', function () {
      expect(context.response.status).to.equal(202)
    })

    it('should forward message', function () {
      expect(messages.length).to.equal(1)

      const message = messages[0]
      expect(message.topic).to.equal(env.KAFKA_PAYLOAD_TOPIC)
      expect(message.key).to.equal('574bd77c-4aba-4557-aa9e-066939f938cc')

      const { payloadId, timestamp, ...otherMessageProps } = message.message
      expect(payloadId).to.match(/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/)
      const now = new Date().getTime()
      expect(new Date(timestamp).getTime()).to.be.within(now - 1000, now + 1000)
      expect(otherMessageProps).to.deep.equal({
        ingest: env.WASP_INGEST_NAME,
        ingestId: '574bd77c-4aba-4557-aa9e-066939f938cc',
        payload: { id: '574bd77c-4aba-4557-aa9e-066939f938cc', answer: 42 },
        metadata: {
          deviceId: '574bd77c-4aba-4557-aa9e-066939f938cc',
        },
      })
    })
  })

  describe('invalid payload (not an object)', function () {
    before(async function () {
      sub.resetMessages()
      context.response = await context.request
        .post(`/${env.API_MAJOR_VERSION}/ingest/${env.WASP_INGEST_NAME}/message`)
        .send()
    })

    it('should respond with http 400', function () {
      expect(context.response.status).to.equal(400)
    })
  })

  describe('invalid payload (no id)', function () {
    before(async function () {
      sub.resetMessages()
      context.response = await context.request
        .post(`/${env.API_MAJOR_VERSION}/ingest/${env.WASP_INGEST_NAME}/message`)
        .send({ answer: 42 })
    })

    it('should respond with http 400', function () {
      expect(context.response.status).to.equal(400)
    })
  })
})
