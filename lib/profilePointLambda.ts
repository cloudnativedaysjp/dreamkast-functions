import { Construct } from 'constructs'
import { Stack, StackProps } from 'aws-cdk-lib'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { StatefulStack, tableNameMap } from './statefulStack'
import { BuildConfig } from './buildConfig'

export type ProfilePointProps = StackProps

export function newProfilePointResources(
  scope: Construct,
  id: string,
  props: ProfilePointProps,
  buildConfig: BuildConfig,
  statefulStack: StatefulStack,
) {
  const tableNames = tableNameMap(buildConfig.Environment)

  // Lambda: postProfilePoint

  const postProfilePointFunction = new NodejsFunction(
    scope,
    'postProfilePoint',
    {
      entry: 'src/postProfilePoint.ts',
      environment: {
        TABLENAME: tableNames.profilePoint,
      },
    },
  )
  postProfilePointFunction.addToRolePolicy(
    new PolicyStatement({
      resources: [statefulStack.profilePointTable.tableArn],
      actions: ['dynamodb:PutItem'],
    }),
  )

  // Lambda: GetProfilePoint

  const getProfilePointFunction = new NodejsFunction(scope, 'getProfilePoint', {
    entry: 'src/getProfilePoint.ts',
    environment: {
      PROFILE_POINT_TABLENAME: tableNames.profilePoint,
      POINT_EVENT_TABLENAME: tableNames.pointEvent,
    },
  })
  getProfilePointFunction.addToRolePolicy(
    new PolicyStatement({
      resources: [
        statefulStack.profilePointTable.tableArn,
        statefulStack.pointEventTable.tableArn,
      ],
      actions: ['dynamodb:Query'],
    }),
  )

  return {
    postProfilePointFunction,
    getProfilePointFunction,
  }
}
