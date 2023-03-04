import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { StatelessStack } from '../lib/statelessStack'
import { CertManagerStack } from '../lib/certManagerStack'
import { StatefulStack } from '../lib/statefulStack'

test('snapshot test', () => {
  const app = new cdk.App()
  const buildConfig = {
    DreamkastApiBaseUrl: 'https://staging.dev.cloudnativedays.jp',
    AWSProfileRegion: 'us-east-2',
    IVSRegion: 'us-east-1',
    Environment: 'test',
    DomainName: 'api.test.cloudnativedays.jp',
    HostedZoneID: 'Z0898116244TOPT4X7AGI',
    ZoneName: 'cloudnativedays.jp',
    AccessControlAllowOrigin: 'hoge.com',
    GetTracksURL: 'https://test.cloudnativedays.jp',
  }

  const certMngStack = new CertManagerStack(
    app,
    `certManager`,
    {
      stackName: `test`,
      env: {
        region: 'ap-northeast-1',
      },
    },
    buildConfig,
  )

  const statefulStack = new StatefulStack(
    app,
    `stateful`,
    {
      stackName: `test`,
      env: {
        region: 'ap-northeast-1',
      },
    },
    buildConfig,
  )

  const stack = new StatelessStack(
    app,
    `stateless`,
    {
      stackName: `test`,
      env: {
        region: 'ap-northeast-1',
      },
    },
    buildConfig,
    statefulStack,
    certMngStack,
  )

  // スタックからテンプレート(JSON)を生成
  const template = Template.fromStack(stack).toJSON()

  // 生成したテンプレートとスナップショットが同じか検証
  expect(template).toMatchSnapshot()
})
