import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { CertManagerStack } from "../lib/cert-manager-stack";

test("snapshot test", () => {
    const app = new cdk.App();

    const stack = new CertManagerStack(app, `stack`, {
        stackName: `test`,
        env: {
            region: 'ap-northeast-1',
        },
    }, {
        Environment: 'test', 
        DomainName : 'api.test.cloudnativedays.jp',
        HostedZoneID : 'Z0898116244TOPT4X7AGI',
        ZoneName: 'cloudnativedays.jp',
        AccessControlAllowOrigin: 'hoge.com',
        GetTracksURL : 'https://test.cloudnativedays.jp',
        AWSProfileRegion : 'ap-northeast-1',
    });

    // スタックからテンプレート(JSON)を生成
    const template = Template.fromStack(stack).toJSON();

    // 生成したテンプレートとスナップショットが同じか検証
    expect(template).toMatchSnapshot();
});