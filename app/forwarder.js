import { Kafka, logLevel as kafkaLogLevels } from 'kafkajs'

import globalLogger from './logger.js'
import env from './env.js'

const { KAFKA_BROKERS, KAFKA_PAYLOAD_TOPIC, KAFKA_LOG_LEVEL, WASP_INGEST_NAME } = env

const setupForward = async () => {
  const logger = globalLogger.child({ module: 'Kafka' })
  const logCreator =
    () =>
    ({ label, log }) => {
      const { message } = log
      logger[label.toLowerCase()]({
        message,
      })
    }

  const kafka = new Kafka({
    clientId: `ingest-${WASP_INGEST_NAME}`,
    brokers: KAFKA_BROKERS,
    logLevel: kafkaLogLevels[KAFKA_LOG_LEVEL.toUpperCase()],
    logCreator,
  })
  const producer = kafka.producer()
  await producer.connect()

  const forward = async ({ ingestId, payload }) => {
    const message = { key: ingestId, value: payload }
    logger.debug(`Publishing payload to ${KAFKA_PAYLOAD_TOPIC}`)
    logger.trace(`Message is %j`, message)

    await producer.send({
      topic: KAFKA_PAYLOAD_TOPIC,
      messages: [message],
    })
  }
  return forward
}

export default setupForward
