import { DynamoDB, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const dynamodb = new DynamoDB({})

const TABLENAME = process.env.TABLENAME || "";

export const handler = async (event: any = {}): Promise<any> => {

    const trackId = Number(event.trackId) ;
    if (!trackId) {
        throw new Error('Error: NaN');
    }

    const record = await dynamodb.send(new GetItemCommand({
        TableName: TABLENAME,
        Key: {
            trackId: {N: String(trackId)},
        },
    }));

    console.log(record)
    if( !record.Item ){
        throw new Error('Error: NotFound');
    }

    const item = unmarshall(record.Item)
    return {
        track_id: trackId,
        viewer_count: item.viewerCount,
    }
};

