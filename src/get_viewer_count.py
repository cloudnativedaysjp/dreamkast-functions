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
            'body' : json.dumps('Error')
        }
        
    res = table.get_item(
        Key={
            'trackId': trackId,
        }
    )
    
    if 'Item' not in res:
        return{
            'statusCode' : '400',
            'body' : json.dumps('Error')
        }
    
    viewer_count = 0
    if 'viewer_count' in res :
        viewer_count = res['viewer_count']
    
    return {
        'statusCode': 200,
        'body': json.dumps('viewer_count : ' + str(viewer_count))
    }
