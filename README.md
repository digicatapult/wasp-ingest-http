# wasp-ingest-http

## Deprecation Notice
`WASP` was deprecated on March 14th 2024, there will be no further dependency or security updates to this platform.
---

WASP Ingest that allows new thing data to be submitted via a HTTP(S) POST request. The service will listen on a path of `/ingest/{WASP_INGEST_NAME}/messages` and accept POST requests with a JSON body. A JSON path is then configured to determine how to get the ingest specific identifier for the thing that created the message from the JSON body.

## Getting started

`wasp-ingest-http` can be run in a similar way to most nodejs applications. First install required dependencies using `npm`:

```sh
npm install
```

`wasp-ingest-http` depends on `Zookeeper` and `Kafka` which can be brought up locally using docker:

```sh
docker-compose up -d
```

You can run the application in development mode with:

```sh
npm run dev
```

Or run tests with:

```sh
npm test
```

## Environment Variables

`wasp-ingest-http` is configured primarily using environment variables as follows:

| variable            | required |      default       | description                                                                                                                       |
| :------------------ | :------: | :----------------: | :-------------------------------------------------------------------------------------------------------------------------------- |
| SERVICE_TYPE        |    N     | `WASP_INGEST_HTTP` | Name of the service type (used to discriminate logs)                                                                              |
| LOG_LEVEL           |    N     |       `info`       | Logging level. Valid values are [`trace`, `debug`, `info`, `warn`, `error`, `fatal`]                                              |
| PORT                |    N     |        `80`        | Port on which the service will listen                                                                                             |
| KAFKA_LOG_LEVEL     |    N     |     `nothing`      | Logging level for Kafka. Valid values are [`debug`, `info`, `warn`, `error`, `nothing`]                                           |
| KAFKA_BROKERS       |    N     |  `localhost:9092`  | List of addresses for the Kafka brokers                                                                                           |
| WASP_INGEST_NAME    |    N     |       `http`       | Name of this ingest type                                                                                                          |
| KAFKA_PAYLOAD_TOPIC |    N     |   `raw-payloads`   | Topic to publish payloads to                                                                                                      |
| INGEST_ID_JSON_PATH |    N     |       `$.id`       | JSON Path to use when extracting the ingest specific identifier associated with the `thing` that produced the data to be ingested |
