import { v4 } from 'uuid'
import jp from 'jsonpath'

import env from './env.js'

const { WASP_INGEST_NAME, INGEST_ID_JSON_PATH } = env

const parseBody = (body) => {
  let result = jp.query(body, INGEST_ID_JSON_PATH)
  if (result.length !== 1) {
    throw new Error(`Could not extract ingest id using path ${INGEST_ID_JSON_PATH} from %j`, body)
  }
  const hardwareSerial = result[0] + ''
  const payloadId = v4()

  return {
    ingestId: hardwareSerial,
    payload: JSON.stringify({
      payloadId,
      ingest: WASP_INGEST_NAME,
      ingestId: hardwareSerial,
      timestamp: new Date().toISOString(),
      payload: body,
      metadata: {
        deviceId: hardwareSerial,
      },
    }),
  }
}

export default parseBody
