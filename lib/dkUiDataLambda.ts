import { Construct } from 'constructs'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { BuildConfig } from './buildConfig'
import { tableNameMap } from './statefulStack'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'

export function newDkUiDataResources(
  scope: Construct,
  buildConfig: BuildConfig,
) {
  const tableNames = tableNameMap(buildConfig.Environment)

  const getDkUiDataFunction = new NodejsFunction(scope, 'getDkUiData', {
    entry: 'src/getDkUiData.ts',
    environment: {
      TABLENAME: tableNames.dkUiData,
    },
  })
  getDkUiDataFunction.addToRolePolicy(
    new PolicyStatement({
      resources: ['arn:aws:dynamodb:*:*:table/*'],
      actions: ['dynamodb:GetItem'],
    }),
  )

  const postDkUiDataFunction = new NodejsFunction(scope, 'patchDkUiData', {
    entry: 'src/postDkUiData.ts',
    environment: {
      TABLENAME: tableNames.dkUiData,
    },
  })
  postDkUiDataFunction.addToRolePolicy(
    new PolicyStatement({
      resources: ['arn:aws:dynamodb:*:*:table/*'],
      actions: ['dynamodb:PutItem'],
    }),
  )

  return {
    getDkUiDataFunction,
    postDkUiDataFunction,
  }
}
