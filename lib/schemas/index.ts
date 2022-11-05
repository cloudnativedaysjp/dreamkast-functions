import {JsonSchemaVersion, JsonSchemaType, JsonSchema} from 'aws-cdk-lib/aws-apigateway';

export const ViewerCountSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    title: 'viewerCountResponse',
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    required: [ "trackId", "viewerCount"],
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
    required: [ "eventAbbr" ],
    properties: {
        eventAbbr: {
            type: JsonSchemaType.STRING,
        },
    },
}

export const ProfilePointSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    title: 'profilePointResponse',
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    required: [ "point", "eventAbbr" ],
    properties: {
        point: {
            type: JsonSchemaType.NUMBER,
        },
        eventAbbr:{
            type: JsonSchemaType.STRING,
        },
        reasonId: {
            type: JsonSchemaType.NUMBER,
        },
        timestamp: {
            type: JsonSchemaType.NUMBER,
        },
        
    },
}

export const ProfilePointsSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    title: 'profilePointResponse',
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    required: [ "points", "total"],
    properties: {
        points: {
            type: JsonSchemaType.ARRAY,
            items: ProfilePointSchema,
        },
        total: {
            type: JsonSchemaType.NUMBER
        },
    },
}