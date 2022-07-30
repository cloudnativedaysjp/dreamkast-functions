import { DynamoDB, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const dynamodb = new DynamoDB({})

const TABLENAME = process.env.TABLENAME || "";

export const handler = async (event: any = {}): Promise<any> => {

    const trackId = Number(event.pathParameters.trackId) ;
    if (!trackId) {
        return {
            statusCode: 400,
            body: `Error: You are missing the path parameter trackId`,
        };
    }

    const record = await dynamodb.send(new GetItemCommand({
        TableName: TABLENAME,
        Key: {
            trackId: {N: String(trackId)},
        },
    }));

    console.log(record)
    if( !record.Item ){
        return { statusCode: 400, body: 'not found Item' };
    }

    const item = unmarshall(record.Item)
    const response = {
        trackId: trackId,
        viewer_count: item.viewerCount,
    }
    return { statusCode: 200, body: JSON.stringify(response) };
};

