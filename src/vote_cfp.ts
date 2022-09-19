import { DynamoDB, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const dynamodb = new DynamoDB({});
const TABLENAME = process.env.TABLENAME || "";

export const handler = async (event: any = {}): Promise<any> => {
    
    const globalIp = String(event.globalIp);
    if (!globalIp) {
            throw new Error('Error400: cannot get global ip');
    }
    const eventName =  String(event.eventName);
    if (!eventName) {
            throw new Error('Error400: cannot get event name');
    }
    const talkId =  Number(event.talkId);
    if (!talkId) {
            throw new Error('Error400: cannot get talkId');
    }
    
    try {
        const command = new PutItemCommand({
            TableName: TABLENAME,
            Item: {
                globalIp: { S: String(globalIp)},
                talkId: { N: String(talkId) },
                eventName: { S: String(eventName)},
            },
        });
        await dynamodb.send(command);
    } catch(error) {
        console.log(error);
    }

    return { 'message' : 'ok' }
};
