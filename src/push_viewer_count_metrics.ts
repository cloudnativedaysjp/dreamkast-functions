import { DynamoDBStreamEvent } from 'aws-lambda'
import { MappedEvent } from './common'

import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics'

const metrics = new Metrics({
  namespace: 'DreamKastFunctions',
  serviceName: 'ViewerCount',
  defaultDimensions: { 
    'environment': process.env.ENV || "", 
    'foo':'bar',
  },
});

export const handler = async (event: DynamoDBStreamEvent ) => {

  event.Records.forEach(r => {
    // eventName is INSERT/MODIFY/REMOVE
    console.log(r.dynamodb?.NewImage)
    //metrics.addMetric('viewerCount', MetricUnits.Count, r.dynamodb?.NewImage.N || 0 );
  })

}
