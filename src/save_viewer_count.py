import json
import os

import boto3
import urllib3

tablename = os.environ['TABLENAME']
get_tracks_url = os.environ['GET_TRACKS_URL']
event_abbr = os.environ['EVENTABBR']

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(tablename)

ivs_client = boto3.client('ivs')

def get_tracks():
    url = get_tracks_url + '?eventAbbr=' + event_abbr
    http = urllib3.PoolManager()
    response = http.request('GET', url)
    json_response = json.loads(response.data)

    return json_response


def lambda_handler(event, context):
    
    tracks = get_tracks()
    
    for track in tracks:
        item = { 'trackId' : track['id'] }
        
        if track['channelArn']:
            item['channelArn'] = track['channelArn']
            try:
                res = ivs_client.get_stream(
                        channelArn=track['channelArn']
                    )
                item['viewerCount'] = res['stream']['viewerCount']
            except Exception as e:
                print(e)

        try:
            _ = table.put_item(
                Item=item
            )
        except Exception as e :
            print(e)

    return {
        'statusCode': 200,
    }
