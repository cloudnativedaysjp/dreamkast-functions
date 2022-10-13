import {JsonSchemaVersion, JsonSchemaType, JsonSchema} from 'aws-cdk-lib/aws-apigateway';

export const ViewerCountSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    title: 'viewerCountResponse',
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    required: [ "track_id", "viewer_count"],
    properties: {
        track_id: {
            type: JsonSchemaType.NUMBER,
        },
        viewer_count: {
            type: JsonSchemaType.NUMBER,
        },
    },
}

export const ProfilePointSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    title: 'profilePointResponse',
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    required: [ "point" ],
    properties: {
        point: {
            type: JsonSchemaType.NUMBER,
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