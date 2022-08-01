import { Construct } from 'constructs';
import { join } from 'path';
import { Stack, StackProps, RemovalPolicy, Duration, CfnOutput } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { BuildConfig } from './build-config'

export class SaveViewerCountStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps, buildConfig: BuildConfig) {
        super(scope, id, props)

        const viewerCountTable = new Table(this, 'ViewerCountTable', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            partitionKey: { name: 'trackId', type: AttributeType.NUMBER },
            removalPolicy: RemovalPolicy.DESTROY
        });

        const saveViewerCountFunction = new NodejsFunction(this, 'saveViewerCount',{
            entry: 'src/save_viewer_count.ts',
            environment: {
                TABLENAME: viewerCountTable.tableName,
                EVENTABBR: scope.node.tryGetContext('EVENTABBR') as string,
                GET_TRACKS_URL: buildConfig.GetTracksURL
            },
        });

        saveViewerCountFunction.addToRolePolicy(new PolicyStatement({
            resources: [
                'arn:aws:dynamodb:*:*:table/*',
                'arn:aws:ivs:*:*:channel/*'
            ],
            actions: [
                'dynamodb:PutItem',
                'ivs:GetStream'
            ]
        }));

        new Rule(this, "saveViewerCountRule", {
            schedule: Schedule.rate(Duration.minutes(1)),
            targets: [
                new LambdaFunction(saveViewerCountFunction)
            ]
        });

        new CfnOutput(this, 'viewerCountTableOutPut',{
            value: viewerCountTable.tableName,
            exportName: `viewerCountTableName-${buildConfig.Environment}`,
        });
    }
}

