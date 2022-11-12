import { APIGatewayEvent } from 'aws-lambda'
import {
  genTransformResponse,
  isNumStr,
  MappedEvent,
  transformEvent,
} from './common'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DkUiDataRepository } from './dkUiDataModel'

export const handler = async (event: APIGatewayEvent | MappedEvent<null>) => {
  const TABLENAME = process.env.TABLENAME || ''
  if (!TABLENAME) {
    throw new Error('Error500: no tablename supplied')
  }
  const dynamodb = new DynamoDB({})
  const repo = new DkUiDataRepository(dynamodb, TABLENAME)
  return await handleMain({ repo }, event)
}

type Context = {
  repo: DkUiDataRepository
}

export async function handleMain(
  ctx: Context,
  event: APIGatewayEvent | MappedEvent<null>,
) {
  const transformResp = genTransformResponse(event)
  const { path } = transformEvent(event)
  const { profileId, conferenceName } = path
  if (!isNumStr(path.profileId)) {
    throw new Error('Error400: profileId is NaN')
  }

  const item = await ctx.repo.get(profileId!, conferenceName!)
  if (!item) {
    throw new Error('Error404: not found')
  }
  return transformResp(item.view())
}
