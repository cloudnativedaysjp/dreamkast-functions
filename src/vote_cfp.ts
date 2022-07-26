import { DynamoDB, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { APIGatewayEvent } from 'aws-lambda'
import { genTransformResponse, MappedEvent, transformEvent } from './common'

const dynamodb = new DynamoDB({})
const TABLENAME = process.env.TABLENAME || ''

type Body = {
  eventAbbr: string
  talkId: string
}

export const handler = async (event: APIGatewayEvent | MappedEvent<Body>) => {
  const transformResp = genTransformResponse(event)

  const { body, path, context } = transformEvent(event)
  const { eventAbbr } = body
  if (!eventAbbr) {
    throw new Error('Error400: eventAbbr must be set')
  }
  const talkId = parseInt(path.talkId || '')
  if (isNaN(talkId)) {
    throw new Error('Error400: cannot get talkId')
  }
  const { sourceIp } = context

  // Timezone is in UTC.
  const timestamp = Date.now()
  try {
    const command = new PutItemCommand({
      TableName: TABLENAME,
      Item: {
        eventAbbr: { S: String(eventAbbr) },
        timestamp: { N: String(timestamp) },
        globalIp: { S: String(sourceIp) },
        talkId: { N: String(talkId) },
      },
    })
    await dynamodb.send(command)
  } catch (error) {
    console.log(error)
  }

  return transformResp({ message: 'ok' })
}
