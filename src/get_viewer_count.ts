import { DynamoDB, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const dynamodb = new DynamoDB({})

const TABLENAME = process.env.TABLENAME || ''

export const handler = async (event: any = {}): Promise<any> => {
  const trackId = parseInt(event.trackId)
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
