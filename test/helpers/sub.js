import { Kafka, logLevel as kafkaLogLevels } from 'kafkajs'
import delay from 'delay'

import env from '../../app/env.js'

const { KAFKA_BROKERS, KAFKA_PAYLOAD_TOPIC } = env

const createSub = async () => {
  const kafka = new Kafka({
    clientId: 'ingest-http-testing',
    brokers: KAFKA_BROKERS,
    logLevel: kafkaLogLevels.ERROR,
  })

  const consumer = kafka.consumer({ groupId: 'test' })
  await consumer.connect()
  await consumer.subscribe({ topic: KAFKA_PAYLOAD_TOPIC, fromBeginning: true })

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

export default createSub
