import { DynamoDB, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { APIGatewayEvent } from 'aws-lambda'
import { genTransformResponse, MappedEvent, transformEvent } from './common'

const dynamodb = new DynamoDB({})
const TABLENAME = process.env.TABLENAME || ''

type Body = {
  conference?: string
  pointEventId?: string
}

export const handler = async (event: APIGatewayEvent | MappedEvent<Body>) => {
  const transformResp = genTransformResponse(event)
  if (!TABLENAME) {
    throw new Error('Error500: TABLENAME is not defined')
  }

  const { body, path } = transformEvent(event)
  const { conference, pointEventId } = body
  const profileId = parseInt(path.profileId || '')
  if (isNaN(profileId)) {
    throw new Error('Error400: cannot get profileId')
  }

  // Timezone is UTC.
  const timestamp = Date.now()

  try {
    const command = new PutItemCommand({
      TableName: TABLENAME,
      Item: {
        profileId: { N: String(profileId) },
        'conference#timestamp': { S: `${conference}#${timestamp}` },
        pointEventId: { S: String(pointEventId) },
      },
    })
    await dynamodb.send(command)
  } catch (error) {
    console.log(error)
    throw new Error("Error500: don't put item")
  }

  return transformResp({ message: 'ok' })
}
