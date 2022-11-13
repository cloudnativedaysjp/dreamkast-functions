import { APIGatewayEvent } from 'aws-lambda'
import {
  genTransformResponse, isNumber,
  isNumStr,
  MappedEvent,
  transformEvent,
} from './common'
import { DynamoDB, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { DkUiDataRepository } from './dkUiDataModel'

const ACTIONS = {
  talkWatched: 'talkWatched',
  stampedFromUI: 'stampedFromUI',
  stampedFromQR: 'stampedFromQR',
}

type Body = {
  action: string
  payload: unknown
}

type TalkWatchedAction = {
  talkId?: number
  trackId?: number
  slotId?: number
}

type StampedFromUIAction = {
  slotId?: number
}

type StampedFromQRAction = {
  slotId?: number
}

export const handler = async (event: APIGatewayEvent | MappedEvent<Body>) => {
  const TABLENAME = process.env.TABLENAME || ''
  if (!TABLENAME) {
    throw new Error('Error500: no table name')
  }
  const dynamodb = new DynamoDB({})
  const repo = new DkUiDataRepository(dynamodb, TABLENAME)
  return handleMain({ repo }, event)
}

type Context = {
  repo: DkUiDataRepository
}

export async function handleMain(
  ctx: Context,
  event: APIGatewayEvent | MappedEvent<Body>,
) {
  const transformResp = genTransformResponse(event)
  const { path, body } = transformEvent(event)
  const { profileId, conference } = path
  if (!isNumStr(path.profileId)) {
    throw new Error('Error400: profileId is NaN')
  }

  let resp: unknown
  if (body.action === ACTIONS.talkWatched) {
    resp = await handleTalkWatchedAction(
      ctx,
      profileId!,
      conference!,
      body.payload as TalkWatchedAction,
    )
  } else if (body.action === ACTIONS.stampedFromUI) {
    resp = await handleStampedFromUIAction(
      ctx,
      profileId!,
      conference!,
      body.payload as StampedFromUIAction,
    )
  } else if (body.action === ACTIONS.stampedFromQR) {
    resp = await handleStampedFromQRAction(
      ctx,
      profileId!,
      conference!,
      body.payload as StampedFromQRAction,
    )
  } else {
    throw new Error(`Error400: unknown action: ${body.action}`)
  }
  return transformResp(resp)
}

async function handleTalkWatchedAction(
  ctx: Context,
  profileId: string,
  confName: string,
  { slotId, trackId, talkId }: TalkWatchedAction,
) {
  if (!isNumber(slotId) || !isNumber(trackId) || !isNumber(talkId)) {
    throw new Error('Error400: missing required field')
  }

  const model = await ctx.repo.getOrNew(profileId, confName)
  const ok = model.addWatchedTalk(slotId, trackId, talkId)
  if (!ok) {
    throw new Error('Error400: Too many requests')
  }
  model.setStampChallengeWhenFulfilled(slotId)
  await ctx.repo.set(profileId, confName, model)

  return { message: 'ok' }
}

async function handleStampedFromUIAction(
  ctx: Context,
  profileId: string,
  confName: string,
  { slotId }: StampedFromUIAction,
) {
  if (!isNumber(slotId)) {
    throw new Error('Error400: slotId is not number')
  }

  const model = await ctx.repo.getOrNew(profileId, confName)
  const updated = model.stampExistingOneAndSkipOthers(slotId)
  if (updated) {
    await ctx.repo.set(profileId, confName, model)
  }

  return { message: 'ok' }
}

async function handleStampedFromQRAction(
  ctx: Context,
  profileId: string,
  confName: string,
  { slotId }: StampedFromQRAction,
) {
  if (!isNumber(slotId)) {
    throw new Error('Error400: slotId is not number')
  }

  const model = await ctx.repo.getOrNew(profileId, confName)
  model.stampSpecifiedOneAndSkipOthers(slotId)
  await ctx.repo.set(profileId, confName, model)

  return { message: 'ok' }
}
