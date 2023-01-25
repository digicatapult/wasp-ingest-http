import envalid from 'envalid'
import dotenv from 'dotenv'
import jp from 'jsonpath'

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: 'test/test.env' })
} else {
  dotenv.config()
}

const vars = envalid.cleanEnv(
  process.env,
  {
    SERVICE_TYPE: envalid.str({ default: 'wasp-ingest-http'.toUpperCase().replace(/-/g, '_') }),
    LOG_LEVEL: envalid.str({ default: 'info', devDefault: 'debug' }),
    PORT: envalid.port({ default: 80, devDefault: 3000 }),
    KAFKA_LOG_LEVEL: envalid.str({
      default: 'nothing',
      choices: ['debug', 'info', 'warn', 'error', 'nothing'],
    }),
    KAFKA_BROKERS: envalid.makeValidator((input) => {
      const kafkaSet = new Set(input === '' ? [] : input.split(','))
      if (kafkaSet.size === 0) throw new Error('At least one kafka broker must be configured')
      return [...kafkaSet]
    })({ default: ['localhost:9092'] }),
    KAFKA_PAYLOAD_TOPIC: envalid.str({ default: 'raw-payloads' }),
    WASP_INGEST_NAME: envalid.str({ default: 'http' }),
    INGEST_ID_JSON_PATH: envalid.makeValidator((input) => {
      try {
        jp.parse(input) // will throw if input is not a json path
        return input
      } catch (err) {
        throw new Error(`Error parsing JSON Path ${input}. Error was ${err.message || err}`)
      }
    })({ default: '$.id' }),
  },
  {
    strict: true,
  }
)

export default vars
