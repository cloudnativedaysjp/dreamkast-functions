import os
import json
import boto3

tablename = os.environ['TABLENAME']

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(tablename)

def lambda_handler(event, context):
    
    try:
        trackId = int(event['pathParameters']['trackId'])
    except Exception as e:
        print(e)
        return{
            'statusCode' : 400,
            'body' : 'trackId is not number'
        }
    
    item = table.get_item(
        Key={
            'trackId': trackId,
        }
    )
    
    if 'Item' not in item:
        return{
            'statusCode' : '400',
            'body' : 'not found Item'
        }
    
    responce =  { 'trackId' : trackId, 'viewer_count' : 0 }
    if 'viewerCount' in item['Item'] :
        responce['viewer_count'] = int(item['Item']['viewerCount'])
    
    return {
        'statusCode': 200,
        'body': json.dumps(responce)
    }
