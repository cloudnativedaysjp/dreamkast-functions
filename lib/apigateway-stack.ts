import { Construct } from 'constructs';
import { Stack, StackProps, Fn } from 'aws-cdk-lib';
import { Function, IFunction } from 'aws-cdk-lib/aws-lambda';
import { Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { DomainName, LambdaIntegration, PassthroughBehavior, RestApi, Model, EndpointType } from 'aws-cdk-lib/aws-apigateway';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { ARecord, IHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ApiGatewayDomain } from 'aws-cdk-lib/aws-route53-targets';

import { ViewerCountSchema } from './schemas';
import { BuildConfig } from './build-config'

export interface APIGatewayProps extends StackProps {
    readonly certificate: Certificate,
    readonly hostedZone: IHostedZone,
    readonly lambda: {
        readonly voteCFP: IFunction,
    }
}

export class APIGatewayStack extends Stack {
    constructor(scope: Construct, id: string, props: APIGatewayProps, buildConfig: BuildConfig) {
        super(scope, id, props)

        // === [ API Gateway ] === 

        const api = new RestApi(this, 'dkFunctionsApi',{
            restApiName: `dk-functions-${buildConfig.Environment}`,
            deployOptions: {
                stageName: 'v1',
            },
        });

         // Custom Domain
        const domainName = new DomainName(this, 'CustomDomain',{
            certificate: props.certificate,
            domainName: buildConfig.DomainName,
            endpointType: EndpointType.REGIONAL,
        });
        domainName.addBasePathMapping(api,{
            basePath: '',
        })

         // A Record
        new ARecord(this, 'APIARecod', {
            zone: props.hostedZone,
            recordName: buildConfig.DomainName,
            target: RecordTarget.fromAlias(new ApiGatewayDomain(domainName))
        });

         // EXECUTION ROLE
        const projectApiExecutionRole = new Role(this, 'ProjectApiExecutionRole', {
            assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
            inlinePolicies: {
            APIGWLambdaPolicy: new PolicyDocument({
                statements: [
                new PolicyStatement({
                    actions: ['lambda:Invoke*'],
                    effect: Effect.ALLOW,
                    resources: ['arn:aws:lambda:*:607167088920:function:*'],
                })
                ]
            })
            }
        });

        /* === [ RESOURCES ] === */
        
        const root = api.root;
        const event = root.addResource('{eventName}');
        
        // TRACKS API
        const tracks = event.addResource('tracks');
        const trackid = tracks.addResource('{trackId}');
        const viewer_count = trackid.addResource('viewer_count');

        // TALKS API
        const talks = event.addResource('talks');
        const talkId = talks.addResource('{talkId}')
        const vote = talkId.addResource('vote');

        /* === [   MODEL   ] === */

        const viewerCountModel = api.addModel('viewerCountModel',{
            contentType: 'application/json',
            modelName: 'ViewerCount',
            schema: ViewerCountSchema,
        })

        /* === [   ResponseParameters   ] === */

        const CorsResponseParameters = {
            'method.response.header.Access-Control-Allow-Methods': "'GET,POST'",
            'method.response.header.Access-Control-Allow-Origin': `'${buildConfig.AccessControlAllowOrigin}'`,
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
        }
        const CorsMethodResponseParameters = {
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Headers': true,
        }

        /* === [   IntegrationResponse   ] === */

        const integrationResponse200 = {
            statusCode: '200',
            responseParameters: CorsResponseParameters,
        }

        const integrationResponse400 = {
            statusCode: '400',
            selectionPattern: 'Error400:.*',
            responseParameters: CorsResponseParameters,
            responseTemplates: {
                'application/json': JSON.stringify({"message":"bad request"}),
            },
        }

        const integrationResponse404 = {
            statusCode: '404',
            selectionPattern: 'Error404:.*',
            responseParameters: CorsResponseParameters,
            responseTemplates: {
                'application/json': JSON.stringify({"message":"not found"}),
            },
        }

        /* === [   MethodResponse   ] === */

        const methodResponses400 = {
            statusCode: '400',
            responseParameters: CorsMethodResponseParameters,
            responseModels: {
                'application/json': Model.ERROR_MODEL,
            },
        }
        const methodResponses404 = {
            statusCode: '404',
            responseParameters: CorsMethodResponseParameters,
            responseModels: {
                'application/json': Model.ERROR_MODEL,
            },
        }

        /* === [   METHODS   ] === */

        // GET /tracks/{trackID}/viewer_count -> GetViewerCountFunction

        const getViewerCountFunctionArn = Fn.importValue(`viewerCountStack-GetViewerCountFunction-Arn-${buildConfig.Environment}`);
        const getViewerCountFunction = Function.fromFunctionArn(this, 'GetViewerCountFunction', getViewerCountFunctionArn);
        viewer_count.addMethod('GET',
            // Integration
            new LambdaIntegration( getViewerCountFunction,
                {
                    proxy: false,
                    credentialsRole: projectApiExecutionRole,
                    passthroughBehavior: PassthroughBehavior.NEVER,
                    requestTemplates: {
                        'application/json': `{
                            #set($trackId = $util.escapeJavaScript($input.params().get("path").get("trackId")))
                            "trackId": #if($trackId == "" ) 0 #{else} "$trackId" #end
                        }`,
                    },
                    integrationResponses: [
                        integrationResponse200,
                        integrationResponse400,
                        integrationResponse404,
                    ],
                },
            ),
            // MethodOptions
            {
                requestParameters: {
                    "method.request.path.trackId": true,
                },
                methodResponses: [
                    {
                        statusCode: '200',
                        responseParameters: CorsMethodResponseParameters,
                        responseModels: {
                            // Need ?
                            'application/json': viewerCountModel,
                        },
                    },
                    methodResponses400,
                    methodResponses404,
                ]
            },
        );

        // PUT /{event}/talk/{trackID}/viewer_count -> GetViewerCountFunction
        vote.addMethod('POST',
            // Integration
            new LambdaIntegration( props.lambda.voteCFP,
                {
                    proxy: false,
                    credentialsRole: projectApiExecutionRole,
                    passthroughBehavior: PassthroughBehavior.NEVER,
                    requestTemplates: {
                        'application/json': `{
                            "eventName":"$util.escapeJavaScript($input.params().get("path").get("eventName"))",
                            "talkId": "$util.escapeJavaScript($input.params().get("path").get("talkId"))",
                            "globalIp": "$util.escapeJavaScript($context.identity.sourceIp)"
                        }`,
                    },
                    integrationResponses: [
                        integrationResponse200,
                        integrationResponse400,
                        integrationResponse404,
                    ],
                },
            ),
            // MethodOptions
            {
                requestParameters: {
                    "method.request.path.eventName": true,
                    "method.request.path.talkId": true,
                },
                methodResponses: [
                    {
                        statusCode: '200',
                        responseParameters: CorsMethodResponseParameters,
                        responseModels: {
                            'application/json': Model.EMPTY_MODEL,
                        },
                    },
                    methodResponses400,
                    methodResponses404,
                ]
            },
        );
    }
}