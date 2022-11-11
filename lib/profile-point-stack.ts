import { Construct } from 'constructs'
import { Stack, StackProps } from 'aws-cdk-lib'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { IFunction } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { StatefulStack } from './statefulStack'

export type ProfilePointProps = StackProps

export function newProfilePointResources(
  scope: Construct,
  id: string,
  props: ProfilePointProps,
  statefulStack: StatefulStack,
) {
  // Lambda: postProfilePoint

  const postProfilePointFunction = new NodejsFunction(
    scope,
    'postProfilePoint',
    {
      entry: 'src/post_profile_point.ts',
      environment: {
        TABLENAME: statefulStack.profilePointTable.tableName,
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
    entry: 'src/get_profile_point.ts',
    environment: {
      PROFILE_POINT_TABLENAME: statefulStack.profilePointTable.tableName,
      POINT_EVENT_TABLENAME: statefulStack.pointEventTable.tableName,
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
