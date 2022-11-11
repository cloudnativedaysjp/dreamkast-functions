import { DynamoDB, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { APIGatewayEvent } from 'aws-lambda'
import { MappedEvent, transformEvent } from './common'

const dynamodb = new DynamoDB({})

const TABLENAME = process.env.TABLENAME || ''

export const handler = async (event: APIGatewayEvent | MappedEvent<null>) => {
  const { path } = transformEvent(event)
  const trackId = parseInt(path.trackId || '')
  if (isNaN(trackId)) {
    throw new Error('Error400: NaN')
  }

  const record = await dynamodb.send(
    new GetItemCommand({
      TableName: TABLENAME,
      Key: {
        trackId: { N: String(trackId) },
      },
    }),
  )

  console.log(record)
  if (!record.Item) {
    throw new Error('Error404: NotFound')
  }

  const item = unmarshall(record.Item)
  return {
    trackId: trackId,
    viewerCount: item.viewerCount,
  }
}
