import { IvsClient, GetStreamCommand } from '@aws-sdk/client-ivs'
import { DynamoDB, PutItemCommand } from '@aws-sdk/client-dynamodb'
import fetch from 'node-fetch'
import { APIGatewayEvent } from 'aws-lambda'
import { MappedEvent } from './common'

const dynamodb = new DynamoDB({})
const ivs = new IvsClient({
  region: process.env.IVS_REGION,
})

const TABLENAME = process.env.TABLENAME || ''
const GET_TRACKS_URL = process.env.GET_TRACKS_URL || ''
const CONFERENCE_NAME = process.env.EVENTABBR || ''

type Record = {
  trackId: number
  trackName: string
  channelArn: string
  viewerCount: number
  confName: string
}

export const handler = async (_: APIGatewayEvent | MappedEvent<null>) => {
  const url = GET_TRACKS_URL + '?eventAbbr=' + CONFERENCE_NAME

  const response: any = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  }).then((response) => response.json())

  const records: Record[] = await Promise.all(
    response.map(async (track: any) => {
      let viewerCount = 0
      try {
        const getStream = new GetStreamCommand({
          channelArn: track['channelArn'],
        })
        const resGetStream = await ivs.send(getStream)
        if (resGetStream.stream) {
          viewerCount = resGetStream.stream.viewerCount as number
        }
      } catch (error) {
        console.log(error)
      }

      return {
        trackId: track['id'],
        trackName: track['name'],
        channelArn: track['channelArn'],
        viewerCount: viewerCount,
        confName: CONFERENCE_NAME,
      }
    }),
  )

  for (const record of records) {
    try {
      const command = new PutItemCommand({
        TableName: TABLENAME,
        Item: {
          trackId: { N: String(record['trackId']) },
          trackName: { S: String(record['trackName']) },
          channelArn: { S: record['channelArn'] },
          viewerCount: { N: String(record['viewerCount']) },
          confName: { S: String(record['confName']) },
        },
      })
      await dynamodb.send(command)
    } catch (error) {
      console.log(error)
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(records),
  }
}
