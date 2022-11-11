import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { ProfilePointStack } from '../lib/profilePointLambda'

test('snapshot test', () => {
  const app = new cdk.App()

  const stack = new ProfilePointStack(app, `stack`, {
    stackName: `test`,
    env: {
      region: 'ap-northeast-1',
    },
  })

  // スタックからテンプレート(JSON)を生成
  const template = Template.fromStack(stack).toJSON()

  // 生成したテンプレートとスナップショットが同じか検証
  expect(template).toMatchSnapshot()
})
