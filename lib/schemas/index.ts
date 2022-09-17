import {JsonSchemaVersion, JsonSchemaType, JsonSchema} from 'aws-cdk-lib/aws-apigateway';

export const ViewerCountSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    title: 'viewerCountResponse',
    type: JsonSchemaType.OBJECT,
    properties: {
        track_id: {
            type: JsonSchemaType.NUMBER
        },
        viewer_count: {
            type: JsonSchemaType.NUMBER
        },
    },
    required: [
        "track_id",
        "viewer_count"
    ]
}