import { readFileSync } from 'fs'
import { DynamoDB, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { createHash } from 'crypto'
import * as yaml from 'js-yaml'
import * as qrcode from 'qrcode'
import * as fs from 'fs'

type PointEvent = {
  id: number
  point: number
  desc: string
}

type Manifest = {
  conference: string
  pointEvents: PointEvent[]
}

type Params = {
  endpoint: string
  dynamoTable: string
}

type Env = 'dev' | 'stg' | 'prd'

const OUT_DIR = './qrcode'

function getParams(env: Env, confName: string): Params {
  switch (env) {
    case 'dev':
      return {
        endpoint: `http://localhost:8080/${confName}/ui/`,
        dynamoTable: 'pointEvent-dev',
      }
    case 'stg':
      return {
        endpoint: `https://staging.dev.cloudnativedays.jp/${confName}/ui/`,
        dynamoTable: 'pointEvent-stg',
      }
    case 'prd':
      return {
        endpoint: `https://event.cloudnativedays.jp/${confName}/ui/`,
        dynamoTable: 'pointEvent-prd',
      }
  }
}

function isEnvValid(env: string): asserts env is Env {
  const envs = ['dev', 'stg', 'prd']
  if (!envs.includes(env)) {
    throw new Error(`Env option must be the one of ${envs}`)
  }
}

function mkdir(dir: string) {
  if (fs.existsSync(dir)) {
    return
  }
  fs.mkdirSync(dir)
}

async function main() {
  const [filePath, env, salt] = process.argv.slice(2)
  if (!filePath) {
    console.info('Usage: npm run load-point-event [filePath] [env] [salt]\n\n')
    throw new Error('Filepath and dynamoTableName are required.')
  }
  isEnvValid(env)

  const outDir = `${OUT_DIR}_${env}`
  mkdir(outDir)

  const data = readFileSync(filePath, 'utf-8')
  const { conference, pointEvents } = yaml.load(data) as Manifest

  const params = getParams(env, conference)
  const dynamodb = new DynamoDB({})

  for (const ev of pointEvents) {
    const pointEventId = getSHA1(salt || conference, ev.id)

    try {
      await dynamodb.send(
        new PutItemCommand({
          TableName: params.dynamoTable,
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

    let url, fileName: string
    if (ev.point === 0) {
      url = params.endpoint + `get-session-point?key=${pointEventId}`
      fileName = `${outDir}/${ev.id}_for_session.png`
    } else {
      url = params.endpoint + `get-point?key=${pointEventId}`
      fileName = `${outDir}/${ev.id}_${ev.point}.png`
    }
    try {
      await qrcode.toFile(fileName, url)
    } catch (err) {
      console.error(err)
      throw new Error(`save qrcode to ${fileName}`)
    }
  }
}

function getSHA1(salt: string, eventNum: number) {
  const shasum = createHash('sha1')
  return shasum.update(`${salt}/${eventNum}`).digest('hex')
}

main()
