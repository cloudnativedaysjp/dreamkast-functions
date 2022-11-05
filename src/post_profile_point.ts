import { DynamoDB, PutItemCommand } from '@aws-sdk/client-dynamodb';

const dynamodb = new DynamoDB({});
const TABLENAME = process.env.TABLENAME || "";

export const handler = async (event: any = {}): Promise<any> => {
    
    const profileId =  parseInt(event.profileId);
    if (isNaN(profileId)) {
            throw new Error('Error400: cannot get profileId');
    }
    
    const point =  parseInt(event.point);
    if (isNaN(point)) {
            throw new Error('Error400: cannot get point');
    }

    const conference = String(event.conference);
    if (!conference) {
        throw new Error('Error400: cannot get conference')
    }

    const reasonId = parseInt(event.reasonId);
    if (isNaN(reasonId)) {
        throw new Error('Error400: cannot get reason')
    }

    if (!TABLENAME) {
        throw new Error('Error500: TABLENAME is not defined')
    }

    // Timezone is UTC.
    const timestamp = Date.now();
    
    try {
        const command = new PutItemCommand({
            TableName: TABLENAME,
            Item: {
                'profileId': { N: String(profileId)},
                'conference#timestamp': { S: `${conference}#${timestamp}`},
                'point': { N: String(point)},
                'reasonId': { N: String(reasonId)},
            },
        });
        await dynamodb.send(command);
    } catch(error) {
        console.log(error);
        throw new Error("Error500: don't put item")
    }

    return { 'message' : 'ok' }
};
