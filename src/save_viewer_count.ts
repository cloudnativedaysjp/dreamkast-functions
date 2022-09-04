import { IvsClient, GetStreamCommand} from '@aws-sdk/client-ivs';
import { DynamoDB, PutItemCommand } from '@aws-sdk/client-dynamodb';
import fetch from 'node-fetch';

const dynamodb = new DynamoDB({});
const ivs = new IvsClient({});

const TABLENAME = process.env.TABLENAME || "";
const GET_TRACKS_URL = process.env.GET_TRACKS_URL || "";
const EVENTABBR = process.env.EVENTABBR || "";

type Record = {
    trackId: number;
    channelArn: string;
    viewerCount: number;
};

export const handler = async (event: any = {}): Promise<any> => {
    
    const url = GET_TRACKS_URL + '?eventAbbr=' + EVENTABBR;

    const response: any = await fetch(url, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    })
    .then(response => response.json())
    
    const records: Record[] = await Promise.all(response.map(async (track: any) => {
        let viewerCount = 0
        try {
            const getStream = new GetStreamCommand({ channelArn: track['channelArn']});
            const resGetStream = await ivs.send(getStream);
            if(resGetStream.stream){
                viewerCount = resGetStream.stream.viewerCount as number;
            }
        } catch(error){
            console.log(error);
        }
        
        return {
            trackId: track['id'] ,
            channelArn: track['channelArn'] ,
            viewerCount: viewerCount,
        }
    }));

    for( const record of records ) {
        try {
            const command = new PutItemCommand({
                TableName: TABLENAME,
                Item: {
                    trackId: { N: String(record['trackId'])},
                    channelArn: { S: record['channelArn']},
                    viewerCount: { N: String(record['viewerCount'])},
                },
            });
            await dynamodb.send(command);
        } catch(error) {
            console.log(error);
        }
    }

    return {
        statusCode: 200,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(records),
    };
};
