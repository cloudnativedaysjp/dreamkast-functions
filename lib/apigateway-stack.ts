import { Construct } from 'constructs';
import { Stack, StackProps, Fn } from 'aws-cdk-lib';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { BuildConfig } from './build-config'
import { LambdaIntegration, Resource,RestApi, Model } from 'aws-cdk-lib/aws-apigateway';

export class APIGatewayStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps, buildConfig: BuildConfig) {
        super(scope, id, props)

        // === [ API Gateway ] === 

        const api = new RestApi(this, 'viewerCountApi',{
            restApiName: `viewer-count-${buildConfig.Environment}`,
            deployOptions: {
                stageName: 'v1'
            },
        });

        /* === [ RESOURCES ] === */
        
        const root = api.root;
        
        // TRACKS API
        const tracks = root.addResource('tracks');
        const trackid = tracks.addResource('{trackId}');
        const viewer_count = trackid.addResource('viewer_count');
        const vote = trackid.addResource('vote');


        /* === [   METHODS   ] === */

        // GET /tracks/{trackID}/viewer_count -> GetViewerCountFunction

        const getViewerCountFunctionArn = Fn.importValue(`viewerCountStack-GetViewerCountFunction-Arn-${buildConfig.Environment}`);
        const getViewerCountFunction = Function.fromFunctionArn(this, 'GetViewerCountFunction', getViewerCountFunctionArn);
        viewer_count.addMethod('GET',
            // Integration
            new LambdaIntegration(
                getViewerCountFunction,
                {
                    proxy: true,
                },
            ),
            // MethodOptions
            {
                methodResponses: [
                    {
                        statusCode: "200",
                        responseModels: {
                            'application/json': Model.EMPTY_MODEL,
                        },
                    }
                ]
            },
        );
    }
}