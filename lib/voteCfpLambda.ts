import { Construct } from 'constructs'
import { Stack, StackProps } from 'aws-cdk-lib'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { BuildConfig } from './buildConfig'
import { IFunction } from 'aws-cdk-lib/aws-lambda'
import { StatefulStack, tableNameMap } from './statefulStack'

export function newVoteCFPResources(
  scope: Construct,
  id: string,
  props: StackProps,
  buildConfig: BuildConfig,
  statefulStack: StatefulStack,
) {
  const tableNames = tableNameMap(buildConfig.Environment)

  // Lambda: Vote
  const voteCFPFunction = new NodejsFunction(scope, 'voteCFP', {
    entry: 'src/voteCfp.ts',
    environment: {
      TABLENAME: tableNames.vote,
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
