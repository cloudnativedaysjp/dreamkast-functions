import { Construct } from 'constructs';
import { join } from 'path';
import { Stack, StackProps, RemovalPolicy, Fn } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { BuildConfig } from './build-config'

export class GetViewerCountStack extends Stack {

    constructor(scope: Construct, id: string, props: StackProps, buildConfig: BuildConfig) {
        super(scope, id, props)

        const importedViewerCountTableName = Fn.importValue('viewerCountTableName');

        const getViewerCountFunction = new Function(this, 'getViewerCount', {
            runtime: Runtime.PYTHON_3_9,
            code: Code.fromAsset(join(__dirname, '..', 'src')),
            environment: {
                TABLENAME: importedViewerCountTableName,
            },
            handler: 'get_viewer_count.lambda_handler'
        });

        getViewerCountFunction.addToRolePolicy(new PolicyStatement({
            resources: [
                'arn:aws:dynamodb:*:*:table/*'
            ],
            actions: [
                'dynamodb:GetItem'
            ]
        }));

        const api = new RestApi(this, 'viewerCountApi',{
            restApiName: `viewer-count-${buildConfig.Environment}`,
            deployOptions: {
                stageName: 'v1'
            },
        });

        // ViewerCount Api lambda integration:
        const getViewerCountLambdaIntegration = new LambdaIntegration(getViewerCountFunction);
        const getViewerCountLambdaTrackIdResource = api.root.addResource('{trackId}');
        const getViewerCountLambdaResource = getViewerCountLambdaTrackIdResource.addResource('viewer_count');
        getViewerCountLambdaResource.addMethod('GET', getViewerCountLambdaIntegration);

    }
}

