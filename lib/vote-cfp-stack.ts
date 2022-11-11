import { Construct } from 'constructs'
import { Stack, StackProps } from 'aws-cdk-lib'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { BuildConfig } from './build-config'
import { IFunction } from 'aws-cdk-lib/aws-lambda'
import { StatefulStack } from './statefulStack'

export function newVoteCFPResources(
  scope: Construct,
  id: string,
  props: StackProps,
  buildConfig: BuildConfig,
  statefulStack: StatefulStack,
) {
  // Lambda: Vote
  const voteCFPFunction = new NodejsFunction(scope, 'voteCFP', {
    entry: 'src/vote_cfp.ts',
    environment: {
      TABLENAME: statefulStack.voteTable.tableName,
    },
  })
  voteCFPFunction.addToRolePolicy(
    new PolicyStatement({
      resources: [statefulStack.voteTable.tableArn],
      actions: ['dynamodb:PutItem'],
    }),
  )

  return {
    voteCFPFunction,
  }
}
