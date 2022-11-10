import {
  JsonSchemaVersion,
  JsonSchemaType,
  JsonSchema,
} from 'aws-cdk-lib/aws-apigateway'

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
