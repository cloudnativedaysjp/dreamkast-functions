import { DynamoDB, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const dynamodb = new DynamoDB({})
const TABLENAME = process.env.TABLENAME || "";

class profilePoint{
    point: number;
    reasonId: number;
    timestamp: number;
}

export const handler = async (event: any = {}): Promise<any> => {

    const profileId = Number(event.profileId) ;
    if (!profileId) {
        throw new Error('Error400: NaN');
    }
    const conference = String(event.conference) ;
    if (!conference) {
        throw new Error('Error400: cannot get conference');
    }

    const records = await dynamodb.send(new QueryCommand({
        TableName: TABLENAME,
        ExpressionAttributeNames: {
            "#pk": "profileId#conference",
        },
        ExpressionAttributeValues: {
            ":pc": {
                S: `${profileId}#${conference}`,
            },
        },
        KeyConditionExpression: "#pk = :pc",
    }));

    const points = records.Items?.map((item) => {
        const record = unmarshall(item);
        const pp: profilePoint = {
            point: record.point,
            reasonId: record.reasonId,
            timestamp: record.timestamp,
        };
        return pp;
    }) || [];

    console.log(points)
    const total = points.reduce((accumulator, current) => {
        if (current.point == undefined ) return accumulator;
        return accumulator + Number(current.point);
    }, 0);

    return {
        points: points,
        total: total,
    }
};