import { readFileSync, writeFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import { DynamoDB, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

const dynamodb = new DynamoDB({})

type Env = 'dev' | 'stg' | 'prd'

function isEnvValid(env: string): asserts env is Env {
  const envs = ['dev', 'stg', 'prd']
  if (!envs.includes(env)) {
    throw new Error(`Env option must be the one of ${envs}`)
  }
}

type Profile = {
  id: number
  email: string
  point: number
  ticket: number
}

function readProfileCsv(filePath: string): Profile[] {
  const buf = readFileSync(filePath, 'utf-8')
  const profiles: Profile[] = parse(buf, { columns: true })
  if (profiles.length === 0) {
    throw new Error('no data')
  }
  const { id, email } = profiles[0]
  if (!id || !email) {
    throw new Error('missing required fields')
  }
  return profiles
}

type Params = {
  conference: string
  pointTable: string
  pointMasterTable: string
}

function getParams(env: Env, conference: string): Params {
  return {
    conference,
    pointMasterTable: `pointEvent-${env}`,
    pointTable: `profilePoint-${env}`,
  }
}

function pointsQuery(p: Params): ScanCommand {
  return new ScanCommand({
    TableName: p.pointTable,
    ExpressionAttributeNames: {
      '#sk': 'conference#timestamp',
    },
    ExpressionAttributeValues: marshall({
      ':sk': `${p.conference}#`,
    }),
    FilterExpression: 'begins_with(#sk, :sk)',
  })
}

function pointMasterQuery(p: Params): QueryCommand {
  return new QueryCommand({
    TableName: p.pointMasterTable,
    ExpressionAttributeNames: {
      '#pk': 'conference',
    },
    ExpressionAttributeValues: marshall({
      ':pc': p.conference,
    }),
    KeyConditionExpression: '#pk = :pc',
  })
}

async function getPointMaster(p: Params): Promise<Record<string, number>> {
  const q = pointMasterQuery(p)
  const res = await dynamodb.send(q)
  if (!res.Items) {
    throw new Error('no record')
  }

  type Row = { pointEventId: string; point: number }
  const rows: Row[] = res.Items.map((i) => unmarshall(i) as Row)
  return rows.reduce((acc, i) => {
    acc[i.pointEventId] = i.point
    return acc
  }, {} as Record<string, number>)
}

function getTotalPointPerUser(
  pointSet: Set<string>,
  pointMaster: Record<string, number>,
): number {
  let total = 0
  pointSet.forEach((v) => {
    total = total + (pointMaster[v] || 0)
  })
  return total
}

async function getTotalPoints(
  p: Params,
  pointMaster: Record<string, number>,
): Promise<Record<string, number>> {
  const q = pointsQuery(p)
  const res = await dynamodb.send(q)
  if (!res.Items) {
    throw new Error('no record')
  }

  type Row = { pointEventId: string; profileId: number }
  const rows: Row[] = res.Items.map((i) => {
    return unmarshall(i) as Row
  })

  const gotPoints: Record<string, Set<string>> = {}
  rows.forEach((r) => {
    const pointSet = gotPoints[r.profileId] || new Set()
    pointSet.add(r.pointEventId)
    gotPoints[r.profileId] = pointSet
  })

  return Object.entries(gotPoints).reduce((acc, [profileId, pointSet]) => {
    acc[profileId] = getTotalPointPerUser(pointSet, pointMaster)
    return acc
  }, {} as Record<string, number>)
}

async function main() {
  const [filePath, conference, env] = process.argv.slice(2)
  if (!filePath) {
    console.info(
      'Usage: npm run get-total-points [filePath] [conference] [env]\n\n',
    )
    throw new Error('Filepath, conference and target env is required.')
  }
  isEnvValid(env)
  const profiles = readProfileCsv(filePath)
  const p = getParams(env, conference)

  const pointMaster = await getPointMaster(p)
  const points = await getTotalPoints(p, pointMaster)

  const out = profiles
    .map((prof) => {
      prof.point = points[prof.id] || 0
      return prof
    })
    .sort((a, b) => {
      return a.point < b.point ? 1 : -1
    })
    .reduce((outBuf, { id, email, point }) => {
      const ticket = Math.floor(point / 100)
      return outBuf + `${id},${email},${ticket},${point}\n`
    }, 'id,email,ticket,point\n')
  console.info(out)
  writeFileSync('./points.csv', out)
}

main()
