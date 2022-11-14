import { DynamoDBStreamEvent } from 'aws-lambda'

import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics'

const metrics = new Metrics({
  namespace: 'DreamKastFunctions',
  serviceName: 'ViewerCount',
  defaultDimensions: { 
    'environment': process.env.ENV || 'UNKNOWN',
  },
});

export const handler = async (event: DynamoDBStreamEvent ) => {

  event.Records.forEach(r => {
    const singleMetric = metrics.singleMetric()
    singleMetric.addDimension('trackName', r.dynamodb?.NewImage?.trackName?.S || 'UNKNOWN' )
    singleMetric.addMetric('viewerCount', MetricUnits.Count, parseInt(r.dynamodb?.NewImage?.viewerCount?.N || '') || 0 );
    singleMetric.publishStoredMetrics()
  })

}
