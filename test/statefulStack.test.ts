import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { StatefulStack } from '../lib/statefulStack'

test('snapshot test', () => {
  const app = new cdk.App()

  const stack = new StatefulStack(
    app,
    `stack`,
    {
      stackName: `test`,
      env: {
        region: 'ap-northeast-1',
      },
    },
    {
      DreamkastApiBaseUrl: 'https://staging.dev.cloudnativedays.jp',
      AWSProfileRegion: 'us-east-2',
      IVSRegion: 'us-east-1',
      Environment: 'test',
      DomainName: 'api.test.cloudnativedays.jp',
      HostedZoneID: 'test',
      ZoneName: 'cloudnativedays.jp',
      AccessControlAllowOrigin: 'hoge.com',
      GetTracksURL: 'https://test.cloudnativedays.jp',
    },
  )

  // スタックからテンプレート(JSON)を生成
  const template = Template.fromStack(stack).toJSON()

  // 生成したテンプレートとスナップショットが同じか検証
  expect(template).toMatchSnapshot()
})
