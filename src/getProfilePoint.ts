import { DynamoDB, QueryCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { APIGatewayEvent } from 'aws-lambda'
import { genTransformResponse, MappedEvent, transformEvent } from './common'

const dynamodb = new DynamoDB({})
const PROFILE_POINT_TABLENAME = process.env.PROFILE_POINT_TABLENAME || ''
const POINT_EVENT_TABLENAME = process.env.POINT_EVENT_TABLENAME || ''

type profilePointResponse = {
  point: number
  pointEventId: string
  timestamp: number
  desc: string
}

export const handler = async (event: APIGatewayEvent | MappedEvent<null>) => {
  if (!PROFILE_POINT_TABLENAME) {
    throw new Error('Error500: TABLENAME is not defined')
  }
  const transformResp = genTransformResponse(event)

  const { path, querystring } = transformEvent(event)
  const { conference } = querystring
  const profileId = parseInt(path.profileId || '')
  if (isNaN(profileId)) {
    throw new Error('Error400: NaN')
  }

  const profilePointRecords = await dynamodb.send(
    (() => {
      if (conference) {
        return new QueryCommand({
          TableName: PROFILE_POINT_TABLENAME,
          ExpressionAttributeNames: {
            '#pk': 'profileId',
            '#sk': 'conference#timestamp',
          },
          ExpressionAttributeValues: marshall({
            ':pc': profileId,
            ':sk': `${conference}#`,
          }),
          KeyConditionExpression: '#pk = :pc AND begins_with(#sk, :sk)',
        })
      } else {
        return new QueryCommand({
          TableName: PROFILE_POINT_TABLENAME,
          ExpressionAttributeNames: {
            '#pk': 'profileId',
          },
          ExpressionAttributeValues: marshall({
            ':pc': profileId,
          }),
          KeyConditionExpression: '#pk = :pc',
        })
      }
    })(),
  )

  const pointEventRecords = await dynamodb.send(
    (() => {
      return new QueryCommand({
        TableName: POINT_EVENT_TABLENAME,
        ExpressionAttributeNames: {
          '#pk': 'conference',
        },
        ExpressionAttributeValues: marshall({
          ':pc': conference,
        }),
        KeyConditionExpression: '#pk = :pc',
      })
    })(),
  )

  const points: { [key: string]: profilePointResponse } = {}
  profilePointRecords.Items?.forEach((item) => {
    const ppr = unmarshall(item)
    pointEventRecords.Items?.forEach((v) => {
      const per = unmarshall(v)
      if (ppr['pointEventId'] == per['pointEventId']) {
        // Records with duplicate conference and pointEventId combinations are not retrieved
        const cp = `${ppr['conference']}#${ppr['pointEventId']}`
        points[cp] = points[cp] || {
          point: per['point'],
          pointEventId: per['pointEventId'],
          timestamp: parseInt(ppr['conference#timestamp'].split('#')[1]),
          desc: per['desc'],
        }
      }
    })
  })

  console.log(points)
  const total = Object.values(points).reduce((t, v) => t + v.point, 0)

  return transformResp({
    points: Object.values(points),
    total: total,
  })
}
