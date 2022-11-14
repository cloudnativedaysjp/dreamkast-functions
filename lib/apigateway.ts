import { Construct } from 'constructs'
import { Stack, StackProps, Fn, RemovalPolicy } from 'aws-cdk-lib'
import { Function, IFunction } from 'aws-cdk-lib/aws-lambda'
import {
  Effect,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam'
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager'
import { ARecord, IHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { ApiGatewayDomain } from 'aws-cdk-lib/aws-route53-targets'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'

import * as apigateway from 'aws-cdk-lib/aws-apigateway'

import {
  ViewerCountSchema,
  ProfilePointRequestSchema,
  ProfilePointsResponseSchema,
  VoteSchema,
  DkUiDataSchema,
  DkUiDataMutationSchema,
} from './schemas'
import { BuildConfig } from './buildConfig'

const requestPassThroughTemplate = `
#set($allParams = $input.params())
{
  "body" : $input.json('$'),
  #foreach($type in $allParams.keySet())
  #set($params = $allParams.get($type))
  "$type" : {
    #foreach($paramName in $params.keySet())
    "$paramName" : "$util.escapeJavaScript($params.get($paramName))"
    #if($foreach.hasNext),#end
    #end
  },
  #end
  "context" : {
    "sourceIp" : "$context.identity.sourceIp"
  }
}
`

export interface APIGatewayProps extends StackProps {
  readonly certificate: Certificate
  readonly hostedZone: IHostedZone
  readonly lambda: {
    readonly getViewerCount: IFunction
    readonly voteCFP: IFunction
    readonly postProfilePoint: IFunction
    readonly getProfilePoint: IFunction
    readonly getDkUiData: IFunction
    readonly postDkUiData: IFunction
  }
}

export function newAPIGatewayResources(
  scope: Construct,
  id: string,
  props: APIGatewayProps,
  buildConfig: BuildConfig,
) {
  // === [ API Gateway ] ===

  const api = new apigateway.RestApi(scope, 'dkFunctionsApi', {
    restApiName: `dk-functions-${buildConfig.Environment}`,
    deployOptions: {
      stageName: 'v1',
      throttlingRateLimit: 60,
      throttlingBurstLimit: 3000,
      dataTraceEnabled: true,
      loggingLevel: apigateway.MethodLoggingLevel.INFO,
      accessLogDestination: new apigateway.LogGroupLogDestination(
        new LogGroup(scope, 'ApiLogGroup', {
          logGroupName: `${id}-apiGateway-${buildConfig.Environment}`,
          retention: RetentionDays.ONE_MONTH,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
      ),
      accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
    },
  })

  const requestValidator = new apigateway.RequestValidator(
    scope,
    'ApiRequestValidator',
    {
      restApi: api,
      validateRequestParameters: true,
      validateRequestBody: true,
    },
  )

  // Custom Domain
  const domainName = new apigateway.DomainName(scope, 'CustomDomain', {
    certificate: props.certificate,
    domainName: buildConfig.DomainName,
    endpointType: apigateway.EndpointType.REGIONAL,
  })
  domainName.addBasePathMapping(api, {
    basePath: '',
  })
  // Not used to follow the dk swagger specifications
  //domainName.addApiMapping(api.deploymentStage,{
  //    basePath: 'api/v1',
  //});

  // A Record
  new ARecord(scope, 'APIARecod', {
    zone: props.hostedZone,
    recordName: buildConfig.DomainName,
    target: RecordTarget.fromAlias(new ApiGatewayDomain(domainName)),
  })

  // EXECUTION ROLE
  const projectApiExecutionRole = new Role(scope, 'ProjectApiExecutionRole', {
    assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    inlinePolicies: {
      APIGWLambdaPolicy: new PolicyDocument({
        statements: [
          new PolicyStatement({
            actions: ['lambda:Invoke*'],
            effect: Effect.ALLOW,
            resources: ['arn:aws:lambda:*:607167088920:function:*'],
          }),
        ],
      }),
    },
  })

  /* === [ RESOURCES ] === */

  const root = api.root
  const apiv1 = root.addResource('api').addResource('v1', {
    defaultCorsPreflightOptions: {
      statusCode: 200,
      allowOrigins: [buildConfig.AccessControlAllowOrigin],
      allowMethods: apigateway.Cors.ALL_METHODS,
      allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
    },
  })

  // Dreamkast
  new apigateway.ProxyResource(scope, 'ProxyResource', {
    parent: apiv1,
    anyMethod: true,
    defaultIntegration: new apigateway.HttpIntegration(
      `${buildConfig.DreamkastApiBaseUrl}/api/v1/{proxy}`,
      {
        proxy: true,
        httpMethod: 'ANY',
        options: {
          credentialsPassthrough: true,
          requestParameters: {
            'integration.request.path.proxy': 'method.request.path.proxy',
          },
        },
      },
    ),
    defaultMethodOptions: {
      requestParameters: {
        'method.request.path.proxy': true,
      },
    },
  })

  // TRACKS
  const tracks = apiv1.addResource('tracks')
  const trackid = tracks.addResource('{trackId}')
  const viewerCount = trackid.addResource('viewer_count')

  // TALKS
  const talks = apiv1.addResource('talks')
  const talkId = talks.addResource('{talkId}')
  const vote = talkId.addResource('vote')

  // Profile
  const profiles = apiv1.addResource('profile')
  const profileId = profiles.addResource('{profileId}')
  const point = profileId.addResource('point')
  const points = profileId.addResource('points')

  // dk-ui AppData
  const appData = apiv1
    .addResource('app-data')
    .addResource('{profileId}')
    .addResource('conference')
    .addResource('{conference}')

  /* === [   MODEL   ] === */

  const viewerCountModel = api.addModel('viewerCountModel', {
    contentType: 'application/json',
    modelName: 'ViewerCount',
    schema: ViewerCountSchema,
  })

  const voteModel = api.addModel('voteModel', {
    contentType: 'application/json',
    modelName: 'Vote',
    schema: VoteSchema,
  })

  const profilePointModel = api.addModel('profilePointModel', {
    contentType: 'application/json',
    modelName: 'ProfilePoint',
    schema: ProfilePointRequestSchema,
  })

  const profilePointsModel = api.addModel('profilePointsModel', {
    contentType: 'application/json',
    modelName: 'ProfilePoints',
    schema: ProfilePointsResponseSchema,
  })

  const dkUiDataModel = api.addModel('dkUiDataModel', {
    contentType: 'application/json',
    modelName: 'DkUiData',
    schema: DkUiDataSchema,
  })

  const dkUiDataMutationModel = api.addModel('dkUiDataMutationModel', {
    contentType: 'application/json',
    modelName: 'DkUiDataMutation',
    schema: DkUiDataMutationSchema,
  })

  /* === [   ResponseParameters   ] === */

  const CorsResponseParameters = {
    'method.response.header.Access-Control-Allow-Methods': "'GET,POST'",
    'method.response.header.Access-Control-Allow-Origin': `'${buildConfig.AccessControlAllowOrigin}'`,
    'method.response.header.Access-Control-Allow-Headers':
      "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
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
      'application/json': JSON.stringify({ message: 'bad request' }),
    },
  }
  const integrationResponse404 = {
    statusCode: '404',
    selectionPattern: 'Error404:.*',
    responseParameters: CorsResponseParameters,
    responseTemplates: {
      'application/json': JSON.stringify({ message: 'not found' }),
    },
  }
  const integrationResponse500 = {
    statusCode: '500',
    selectionPattern: 'Error500:.*',
    responseParameters: CorsResponseParameters,
    responseTemplates: {
      'application/json': JSON.stringify({
        message: 'internal server error',
      }),
    },
  }

  /* === [   MethodResponse   ] === */

  const methodResponses200 = {
    statusCode: '200',
    responseParameters: CorsMethodResponseParameters,
    responseModels: {
      'application/json': apigateway.Model.EMPTY_MODEL,
    },
  }
  const methodResponses400 = {
    statusCode: '400',
    responseParameters: CorsMethodResponseParameters,
    responseModels: {
      'application/json': apigateway.Model.ERROR_MODEL,
    },
  }
  const methodResponses404 = {
    statusCode: '404',
    responseParameters: CorsMethodResponseParameters,
    responseModels: {
      'application/json': apigateway.Model.ERROR_MODEL,
    },
  }
  const methodResponses500 = {
    statusCode: '500',
    responseParameters: CorsMethodResponseParameters,
    responseModels: {
      'application/json': apigateway.Model.ERROR_MODEL,
    },
  }

  /* === [   METHODS   ] === */

  // GET /tracks/{trackID}/viewer_count -> GetViewerCountFunction
  viewerCount.addMethod(
    'GET',
    // Integration
    new apigateway.LambdaIntegration(props.lambda.getViewerCount, {
      proxy: false,
      credentialsRole: projectApiExecutionRole,
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': requestPassThroughTemplate,
      },
      integrationResponses: [
        integrationResponse200,
        integrationResponse400,
        integrationResponse404,
      ],
    }),
    // MethodOptions
    {
      requestParameters: {
        'method.request.path.trackId': true,
      },
      requestValidator: requestValidator,
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
      ],
    },
  )

  // POST /talk/{trackID}/vote -> VoteCFP
  vote.addMethod(
    'POST',
    // Integration
    new apigateway.LambdaIntegration(props.lambda.voteCFP, {
      proxy: false,
      credentialsRole: projectApiExecutionRole,
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': requestPassThroughTemplate,
      },
      integrationResponses: [
        integrationResponse200,
        integrationResponse400,
        integrationResponse404,
      ],
    }),
    // MethodOptions
    {
      requestValidator: requestValidator,
      requestParameters: {
        'method.request.path.talkId': true,
      },
      requestModels: {
        'application/json': voteModel,
      },
      methodResponses: [
        methodResponses200,
        methodResponses400,
        methodResponses404,
      ],
    },
  )

  // POST /profiles/{profileId}/point -> PostProfilePointFunction
  point.addMethod(
    'POST',
    // Integration
    new apigateway.LambdaIntegration(props.lambda.postProfilePoint, {
      proxy: false,
      credentialsRole: projectApiExecutionRole,
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': requestPassThroughTemplate,
      },
      integrationResponses: [
        integrationResponse200,
        integrationResponse400,
        integrationResponse404,
      ],
    }),
    // MethodOptions
    {
      requestValidator: requestValidator,
      requestParameters: {
        'method.request.path.profileId': true,
      },
      requestModels: {
        'application/json': profilePointModel,
      },
      methodResponses: [
        methodResponses200,
        methodResponses400,
        methodResponses404,
        methodResponses500,
      ],
    },
  )

  // GET /profiles/{profileId}/points -> GetProfilePointFunction
  points.addMethod(
    'GET',
    // Integration
    new apigateway.LambdaIntegration(props.lambda.getProfilePoint, {
      proxy: false,
      credentialsRole: projectApiExecutionRole,
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': requestPassThroughTemplate,
      },
      integrationResponses: [
        integrationResponse200,
        integrationResponse400,
        integrationResponse500,
      ],
    }),
    // MethodOptions
    {
      requestValidator: requestValidator,
      requestParameters: {
        'method.request.querystring.conference': true,
        'method.request.path.profileId': true,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: CorsMethodResponseParameters,
          responseModels: {
            'application/json': profilePointsModel,
          },
        },
        methodResponses400,
        methodResponses500,
      ],
    },
  )

  // GET /app-data/{profileId}/conference/{conference}
  appData.addMethod(
    'GET',
    // Integration
    new apigateway.LambdaIntegration(props.lambda.getDkUiData, {
      proxy: false,
      credentialsRole: projectApiExecutionRole,
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': requestPassThroughTemplate,
      },
      integrationResponses: [
        integrationResponse200,
        integrationResponse400,
        integrationResponse500,
      ],
    }),
    // MethodOptions
    {
      requestValidator: requestValidator,
      requestParameters: {
        'method.request.path.conference': true,
        'method.request.path.profileId': true,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: CorsMethodResponseParameters,
          responseModels: {
            'application/json': dkUiDataModel,
          },
        },
        methodResponses400,
        methodResponses500,
      ],
    },
  )

  // POST /app-data/{profileId}/conference/{conference}
  appData.addMethod(
    'POST',
    // Integration
    new apigateway.LambdaIntegration(props.lambda.postDkUiData, {
      proxy: false,
      credentialsRole: projectApiExecutionRole,
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': requestPassThroughTemplate,
      },
      integrationResponses: [
        integrationResponse200,
        integrationResponse400,
        integrationResponse500,
      ],
    }),
    // MethodOptions
    {
      requestValidator: requestValidator,
      requestParameters: {
        'method.request.path.conference': true,
        'method.request.path.profileId': true,
      },
      requestModels: {
        'application/json': dkUiDataMutationModel,
      },
      methodResponses: [
        methodResponses200,
        methodResponses400,
        methodResponses500,
      ],
    },
  )

  return {}
}
