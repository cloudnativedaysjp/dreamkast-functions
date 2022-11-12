import { Construct } from 'constructs'
import { Stack, StackProps, Duration, CfnOutput } from 'aws-cdk-lib'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { Rule, Schedule } from 'aws-cdk-lib/aws-events'
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { StartingPosition } from 'aws-cdk-lib/aws-lambda'
import { BuildConfig } from './buildConfig'
import { StatefulStack, tableNameMap } from './statefulStack'
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources'

export function newViewerCountResources(
  scope: Construct,
  id: string,
  props: StackProps,
  buildConfig: BuildConfig,
  statefulStack: StatefulStack,
) {
  const tableNames = tableNameMap(buildConfig.Environment)

  // Lambda: SaveViewerCount

  const saveViewerCountFunction = new NodejsFunction(scope, 'saveViewerCount', {
    entry: 'src/save_viewer_count.ts',
    environment: {
      TABLENAME: tableNames.viewerCount,
      EVENTABBR: scope.node.tryGetContext('EVENTABBR') as string,
      GET_TRACKS_URL: buildConfig.GetTracksURL,
    },
  })
  saveViewerCountFunction.addToRolePolicy(
    new PolicyStatement({
      resources: ['arn:aws:dynamodb:*:*:table/*', 'arn:aws:ivs:*:*:channel/*'],
      actions: ['dynamodb:PutItem', 'ivs:GetStream'],
    }),
  )

  // EventBridge

  new Rule(scope, 'saveViewerCountRule', {
    schedule: Schedule.rate(Duration.minutes(1)),
    targets: [new LambdaFunction(saveViewerCountFunction)],
  })

  // Lambda: GetViewerCount

  const getViewerCountFunction = new NodejsFunction(scope, 'getViewerCount', {
    entry: 'src/get_viewer_count.ts',
    environment: {
      TABLENAME: tableNames.viewerCount,
    },
  })
  getViewerCountFunction.addToRolePolicy(
    new PolicyStatement({
      resources: ['arn:aws:dynamodb:*:*:table/*'],
      actions: ['dynamodb:GetItem'],
    }),
  )

  // Lambda: PushViewerCountMetrics

  const pushViewerCountMetrics = new NodejsFunction(scope, 'pushViewerCountMetrics', {
    entry: 'src/push_viewer_count_metrics.ts',
    environment: {
      ENV: buildConfig.Environment,
    },
  })
  pushViewerCountMetrics.addToRolePolicy(
    new PolicyStatement({
      resources: [statefulStack.viewerCountTable.tableArn],
      actions: [
        'dynamodb:GetShardIterator',
        'dynamodb:GetRecords',
        'dynamodb:ListStream',
        'dynamodb:DescribeStream',
      ],
    }),
  )
  pushViewerCountMetrics.addEventSource(
    new DynamoEventSource( statefulStack.viewerCountTable,{
      startingPosition: StartingPosition.LATEST,
    })
  )

  return {
    saveViewerCountFunction,
    getViewerCountFunction,
  }
}
