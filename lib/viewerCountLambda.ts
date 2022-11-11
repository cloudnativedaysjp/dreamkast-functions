import { Construct } from 'constructs'
import { Stack, StackProps, Duration, CfnOutput } from 'aws-cdk-lib'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { Rule, Schedule } from 'aws-cdk-lib/aws-events'
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { BuildConfig } from './buildConfig'
import { StatefulStack, tableNameMap } from './statefulStack'

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

  // OutPut

  new CfnOutput(scope, 'viewerCountArnOutPut', {
    value: getViewerCountFunction.functionArn,
    exportName: `viewerCountStack-GetViewerCountFunction-Arn-${buildConfig.Environment}`,
  })

  return {
    saveViewerCountFunction,
    getViewerCountFunction,
  }
}
