import { Construct } from 'constructs';
import { Stack, StackProps, RemovalPolicy, Fn } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { BuildConfig } from './build-config'

export class GetViewerCountStack extends Stack {

    constructor(scope: Construct, id: string, props: StackProps, buildConfig: BuildConfig) {
        super(scope, id, props)

        const importedViewerCountTableName = Fn.importValue(`viewerCountTableName-${buildConfig.Environment}`);

        const getViewerCountFunction = new NodejsFunction(this, 'getViewerCount',{
            entry: 'src/get_viewer_count.ts',
            environment: {
                TABLENAME: importedViewerCountTableName,
            },
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

