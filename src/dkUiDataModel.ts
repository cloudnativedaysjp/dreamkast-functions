import {
  DynamoDB,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { getTimestamp } from './common'

type StampChallenge = {
  slotId: number
  waiting: boolean
  condition?: 'stamped' | 'skipped'
  timestamp?: number
}

export type DkUiData = {
  watchedTalksOnline: {
    history: {
      [slotId: number]: {
        talkId: number
        trackId: number
        timestamp: number
      }[]
    }
    prevTimestamp: number
  }
  stampChallenges: StampChallenge[]
}

export type DkUiView = {
  watchedTalksOnline: {
    watchingTime: {
      [slotId: number]: number
    }
    prevTimestamp: number
  }
  stampChallenges: StampChallenge[]
}

export class DkUiDataModel {
  data: DkUiData

  COUNT_PERIOD = 120
  // TODO fix to 10
  TOTAL_COUNT_FOR_STAMP = 3
  // TODO fix to 110
  GUARD_PERIOD = 1 // COUNT_PERIOD - 10

  constructor(data: DkUiData) {
    this.data = data
  }

  addWatchedTalk(slotId: number, trackId: number, talkId: number): boolean {
    const currTimestamp = getTimestamp()
    const { prevTimestamp } = this.data.watchedTalksOnline
    if (currTimestamp < prevTimestamp + this.GUARD_PERIOD) {
      return false
    }
    const history = this.data.watchedTalksOnline.history[slotId] || []
    history.push({ trackId, talkId, timestamp: currTimestamp })
    this.data.watchedTalksOnline.history[slotId] = history
    this.data.watchedTalksOnline.prevTimestamp = currTimestamp
    return true
  }

  setStampChallengeWhenFulfilled(slotId: number) {
    const history = this.data.watchedTalksOnline.history[slotId] || []
    if (history.length < this.TOTAL_COUNT_FOR_STAMP) {
      return
    }
    if (this.data.stampChallenges.find((i) => i.slotId === slotId)) {
      return
    }
    this.data.stampChallenges.push({
      slotId: slotId,
      waiting: true,
    })
  }

  stampExistingOneAndSkipOthers(slotId: number): boolean {
    const stampChallenge = this.data.stampChallenges.find(
      (i) => i.slotId === slotId && i.waiting,
    )
    if (!stampChallenge) {
      return false
    }
    stampChallenge.waiting = false
    stampChallenge.condition = 'stamped'
    stampChallenge.timestamp = getTimestamp()

    this.data.stampChallenges.forEach((i) => {
      if (i.waiting) {
        i.waiting = false
        i.condition = 'skipped'
      }
    })
    return true
  }

  stampSpecifiedOneAndSkipOthers(slotId: number) {
    const stampChallenge = this.data.stampChallenges.find(
      (i) => i.slotId === slotId,
    )
    if (stampChallenge) {
      stampChallenge.waiting = false
      stampChallenge.condition = 'stamped'
      stampChallenge.timestamp = getTimestamp()
    } else {
      this.data.stampChallenges.push({
        slotId,
        waiting: false,
        condition: 'stamped',
        timestamp: getTimestamp(),
      })
    }
    this.data.stampChallenges.forEach((i) => {
      if (i.waiting) {
        i.condition = 'skipped'
        i.waiting = false
      }
    })
  }

  view(): DkUiView {
    return {
      watchedTalksOnline: {
        watchingTime: Object.entries(
          this.data.watchedTalksOnline.history,
        ).reduce((accum, [k, v]) => {
          accum[k] = v.length * this.COUNT_PERIOD
          return accum
        }, {} as Record<string, number>),
        prevTimestamp: this.data.watchedTalksOnline.prevTimestamp,
      },
      stampChallenges: this.data.stampChallenges,
    }
  }
}

export class DkUiDataRepository {
  dynamodb: DynamoDB
  tableName: string
  constructor(dynamodb: DynamoDB, tableName: string) {
    this.dynamodb = dynamodb
    this.tableName = tableName
  }

  new(): DkUiDataModel {
    return new DkUiDataModel({
      watchedTalksOnline: {
        history: {},
        prevTimestamp: 0,
      },
      stampChallenges: [],
    })
  }

  async get(
    profileId: string,
    conference: string,
  ): Promise<DkUiDataModel | null> {
    const record = await this.dynamodb.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: {
          profileId: { N: profileId! },
          conferenceName: { S: conference! },
        },
      }),
    )
    if (!record.Item) {
      return null
    }
    const data: DkUiData = JSON.parse(unmarshall(record.Item).appData)
    return new DkUiDataModel(data)
  }

  async getOrNew(
    profileId: string,
    conference: string,
  ): Promise<DkUiDataModel> {
    const item = await this.get(profileId, conference)
    if (!item) {
      return this.new()
    }
    return item
  }

  async set(profileId: string, conference: string, model: DkUiDataModel) {
    try {
      await this.dynamodb.send(
        new PutItemCommand({
          TableName: this.tableName,
          Item: {
            profileId: { N: profileId },
            conferenceName: { S: conference },
            appData: { S: JSON.stringify(model.data) },
          },
        }),
      )
    } catch (err) {
      console.error(err)
      throw new Error(`Error500: put item`)
    }
  }
}
