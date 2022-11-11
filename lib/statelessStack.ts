import { Construct } from 'constructs'
import { Stack, StackProps } from 'aws-cdk-lib'
import { BuildConfig } from './build-config'
import { newCertManagerResources } from './cert-manager-stack'
import { newProfilePointResources } from './profile-point-stack'
import { newAPIGatewayResources } from './apigateway-stack'
import { newVoteCFPResources } from './vote-cfp-stack'
import { StatefulStack } from './statefulStack'
import { newViewerCountResources } from './viewer-count-stack'

export class StatelessStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StackProps,
    buildConfig: BuildConfig,
    statefulStack: StatefulStack,
  ) {
    super(scope, id, props)

    const viewerCountResources = newViewerCountResources(
      this,
      `viewerCount`,
      {
        stackName: `viewerCount`,
        env: {
          region: buildConfig.AWSProfileRegion,
        },
      },
      buildConfig,
      statefulStack,
    )

    const voteCFPStack = newVoteCFPResources(
      this,
      `voteCFP`,
      {
        stackName: `voteCFP`,
        env: {
          region: buildConfig.AWSProfileRegion,
        },
      },
      buildConfig,
      statefulStack,
    )

    const certManager = newCertManagerResources(
      this,
      `certManager`,
      {
        stackName: `certManager`,
        env: {
          region: buildConfig.AWSProfileRegion,
        },
      },
      buildConfig,
    )

    const profilePointStack = newProfilePointResources(
      this,
      `profilePoint`,
      {
        stackName: `profilePoint`,
        env: {
          region: buildConfig.AWSProfileRegion,
        },
      },
      statefulStack,
    )

    const apiGatewayStack = newAPIGatewayResources(
      this,
      `apiGateway`,
      {
        certificate: certManager.certificate,
        hostedZone: certManager.hostedZone,
        lambda: {
          getViewerCount: viewerCountResources.getViewerCountFunction,
          voteCFP: voteCFPStack.voteCFPFunction,
          postProfilePoint: profilePointStack.postProfilePointFunction,
          getProfilePoint: profilePointStack.getProfilePointFunction,
        },
        stackName: `apiGateway`,
        env: {
          region: buildConfig.AWSProfileRegion,
        },
      },
      buildConfig,
    )
    //apiGatewayStack.addDependency(viewerCountStack);
    //apiGatewayStack.addDependency(voteCFPStack);
  }
}
