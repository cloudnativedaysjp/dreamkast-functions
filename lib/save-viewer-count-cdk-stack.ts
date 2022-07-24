import { Construct } from 'constructs';
import { join } from 'path';
import { Stack, StackProps, RemovalPolicy, Duration, CfnOutput } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { BuildConfig } from './build-config'

export class SaveViewerCountStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps, buildConfig: BuildConfig) {
        super(scope, id, props)

        const viewerCountTable = new Table(this, 'ViewerCountTable', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            partitionKey: { name: 'trackId', type: AttributeType.NUMBER },
            //partitionKey: { name: 'trackId', type: AttributeType.STRING },
            //sortKey: { name: 'channelArn', type: AttributeType.STRING },
            removalPolicy: RemovalPolicy.DESTROY
        });

        const saveViewerCountFunction = new Function(this, 'saveViewerCount', {
            runtime: Runtime.PYTHON_3_9,
            code: Code.fromAsset(join(__dirname, '..', 'src')),
            environment: {
                TABLENAME: viewerCountTable.tableName,
                EVENTABBR: scope.node.tryGetContext('EVENTABBR') as string,
                GET_TRACKS_URL: buildConfig.GetTracksURL
            },
            handler: 'save_viewer_count.lambda_handler'
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

