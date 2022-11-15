import { readFileSync } from 'fs'
import { DynamoDB, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { createHash } from 'crypto'
import * as yaml from 'js-yaml'

type PointEvent = {
  id: number
  point: number
  desc: string
}

type Manifest = {
  conference: string
  pointEvents: PointEvent[]
}

async function main() {
  const [filePath, dynamoTableName, salt] = process.argv.slice(2)
  if (!filePath || !dynamoTableName) {
    console.info(
      'Usage: npm run load-point-event [filePath] [dynamoTableName] [salt]\n\n',
    )
    throw new Error('Filepath and dynamoTableName are required.')
  }
  const data = readFileSync(filePath, 'utf-8')
  const { conference, pointEvents } = yaml.load(data) as Manifest

  const dynamodb = new DynamoDB({})

  for (const ev of pointEvents) {
    const pointEventId = getSHA1(salt || conference, ev.id)

    try {
      await dynamodb.send(
        new PutItemCommand({
          TableName: dynamoTableName,
          Item: {
            conference: { S: conference },
            pointEventId: { S: pointEventId },
            eventNum: { N: `${ev.id}` },
            point: { N: `${ev.point}` },
            desc: { S: ev.desc },
          },
        }),
      )
    } catch (err) {
      console.error(err)
      throw new Error(`load ${JSON.stringify(ev)}`)
    }
    console.info(`${pointEventId} ${ev.id} -- ${ev.desc}`)
  }
}

function getSHA1(salt: string, eventNum: number) {
  const shasum = createHash('sha1')
  return shasum.update(`${salt}/${eventNum}`).digest('hex')
}

main()
