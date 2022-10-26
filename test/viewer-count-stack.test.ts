import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { ViewerCountStack } from "../lib/viewer-count-stack";

test("snapshot test", () => {
    const app = new cdk.App();

    const stack = new ViewerCountStack(app, `stack`, {
        stackName: `test`,
        env: {
            region: 'ap-northeast-1',
        },
    }, {
        Environment: 'test', 
        DomainName : 'api.test.cloudnativedays.jp',
        HostedZoneID : 'test',
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