const { Kafka, logLevel: kafkaLogLevels } = require('kafkajs')
require('dotenv').config()
const delay = require('delay')

const env = require('../../app/env')

const createSub = async () => {
  const kafka = new Kafka({
    clientId: 'ingest-http-testing',
    brokers: env.KAFKA_BROKERS,
    logLevel: kafkaLogLevels.ERROR,
  })

  const consumer = kafka.consumer({ groupId: 'test' })
  await consumer.connect()
  await consumer.subscribe({ topic: env.KAFKA_PAYLOAD_TOPIC, fromBeginning: true })

  const messages = []
  await consumer.run({
    eachMessage: async ({ topic, partition, message: { key, value } }) => {
      messages.push({
        topic,
        partition,
        key: key.toString('utf8'),
        message: JSON.parse(value.toString('utf8')),
      })
    },
  })
  const resetMessages = () => {
    messages.splice(0, messages.length)
  }
  const waitForMessages = async ({ expectedMessages = 1, waitForExcessMessagesMS = 50 }) => {
    while (messages.length < expectedMessages) {
      await delay(10)
    }
    await delay(waitForExcessMessagesMS)
    return [...messages]
  }

  return {
    resetMessages,
    waitForMessages,
    disconnect: async () => {
      await consumer.stop()
      await consumer.disconnect()
    },
  }
}

module.exports = createSub
