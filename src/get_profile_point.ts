import { DynamoDB, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const dynamodb = new DynamoDB({})
const TABLENAME = process.env.TABLENAME || "";

class profilePoint{
    point: number;
    reasonId: number;
    timestamp: number;
    eventAbbr: string;
}

export const handler = async (event: any = {}): Promise<any> => {

    const profileId = parseInt(event.profileId) ;
    if (isNaN(profileId)) {
        throw new Error('Error400: NaN');
    }

    if (!TABLENAME) {
        throw new Error('Error500: TABLENAME is not defined')
    }

    const conference = String(event.conference) ;
    const cmd = (() => {
        if (conference) {
            return new QueryCommand({
                TableName: TABLENAME,
                ExpressionAttributeNames: {
                    "#pk": "profileId",
                    "#sk": "conference#timestamp",
                },
                ExpressionAttributeValues: marshall({
                    ":pc": profileId,
                    ":sk": `${conference}#`,
                }),
                KeyConditionExpression: "#pk = :pc AND begins_with(#sk, :sk)",
            });
        } else {
            return new QueryCommand({
                TableName: TABLENAME,
                ExpressionAttributeNames: {
                    "#pk": "profileId",
                },
                ExpressionAttributeValues: marshall({
                    ":pc": profileId,
                }),
                KeyConditionExpression: "#pk = :pc",
            });
        }
    })();

    const records = await dynamodb.send(cmd);

    const points = records.Items?.map((item) => {
        const record = unmarshall(item);

        const pp: profilePoint = {
            point: record['point'],
            reasonId: record['reasonId'],
            timestamp: record['profileId'],
            eventAbbr: record['conference#timestamp'].split('#')[0],
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
