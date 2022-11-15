import {
  JsonSchema,
  JsonSchemaType,
  JsonSchemaVersion,
} from 'aws-cdk-lib/aws-apigateway'

export const CommonResponseSchema: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  title: 'commonResponse',
  type: JsonSchemaType.OBJECT,
  additionalProperties: true,
  properties: {
    status: {
      type: JsonSchemaType.STRING,
    },
    message: {
      type: JsonSchemaType.STRING,
    },
  },
}

export const ViewerCountSchema: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  title: 'viewerCountResponse',
  type: JsonSchemaType.OBJECT,
  additionalProperties: false,
  required: ['trackId', 'viewerCount'],
  properties: {
    trackId: {
      type: JsonSchemaType.NUMBER,
    },
    viewerCount: {
      type: JsonSchemaType.NUMBER,
    },
  },
}

export const VoteSchema: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  title: 'voteResponse',
  type: JsonSchemaType.OBJECT,
  additionalProperties: false,
  required: ['eventAbbr'],
  properties: {
    eventAbbr: {
      type: JsonSchemaType.STRING,
    },
  },
}

export const ProfilePointRequestSchema: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  title: 'profilePointRequest',
  type: JsonSchemaType.OBJECT,
  additionalProperties: false,
  required: ['pointEventId', 'conference'],
  properties: {
    conference: {
      type: JsonSchemaType.STRING,
    },
    pointEventId: {
      type: JsonSchemaType.STRING,
    },
  },
}

export const ProfilePointResponseSchema: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  title: 'profilePointResponse',
  type: JsonSchemaType.OBJECT,
  additionalProperties: false,
  required: ['pointEventId', 'conference'],
  properties: {
    point: {
      type: JsonSchemaType.NUMBER,
    },
    conference: {
      type: JsonSchemaType.STRING,
    },
    pointEventId: {
      type: JsonSchemaType.STRING,
    },
    timestamp: {
      type: JsonSchemaType.NUMBER,
    },
  },
}

export const ProfilePointsResponseSchema: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  title: 'profilePointsResponse',
  type: JsonSchemaType.OBJECT,
  additionalProperties: false,
  required: ['points', 'total'],
  properties: {
    points: {
      type: JsonSchemaType.ARRAY,
      items: ProfilePointResponseSchema,
    },
    total: {
      type: JsonSchemaType.NUMBER,
    },
  },
}

export const DkUiDataSchema: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  title: 'dkUiData',
  type: JsonSchemaType.OBJECT,
  additionalProperties: true,
  required: ['watchedTalksOnline', 'stampChallenges'],
  properties: {
    watchedTalksOnline: {
      type: JsonSchemaType.OBJECT,
      properties: {
        watchingTime: {
          type: JsonSchemaType.OBJECT,
          additionalProperties: true,
        },
        prevTimestamp: {
          type: JsonSchemaType.NUMBER,
        },
      },
    },
    stampChallenges: {
      type: JsonSchemaType.ARRAY,
      items: {
        type: JsonSchemaType.OBJECT,
        required: ['slotId', 'waiting'],
        properties: {
          slotId: {
            type: JsonSchemaType.NUMBER,
          },
          waiting: {
            type: JsonSchemaType.BOOLEAN,
          },
          condition: {
            type: JsonSchemaType.STRING,
          },
          timestamp: {
            type: JsonSchemaType.NUMBER,
          },
        },
      },
    },
  },
}

export const DkUiDataMutationSchema: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  title: 'dkUiDataMutation',
  type: JsonSchemaType.OBJECT,
  additionalProperties: false,
  required: ['action', 'payload'],
  properties: {
    action: {
      type: JsonSchemaType.STRING,
    },
    payload: {
      type: JsonSchemaType.OBJECT,
      additionalProperties: true,
    },
  },
}
