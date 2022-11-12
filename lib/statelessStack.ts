import { Construct } from 'constructs'
import { Stack, StackProps } from 'aws-cdk-lib'
import { BuildConfig } from './buildConfig'
import { CertManagerStack } from './certManagerStack'
import { newProfilePointResources } from './profilePointLambda'
import { newAPIGatewayResources } from './apigateway'
import { newVoteCFPResources } from './voteCfpLambda'
import { StatefulStack } from './statefulStack'
import { newViewerCountResources } from './viewerCountLambda'
import { newDkUiDataResources } from './dkUiDataLambda'

export class StatelessStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StackProps,
    buildConfig: BuildConfig,
    statefulStack: StatefulStack,
    certManagerStack: CertManagerStack,
  ) {
    super(scope, id, props)

    // TODO remove unneeded fields like 'stackName'
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

    const voteCFPResources = newVoteCFPResources(
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

    const profilePointResources = newProfilePointResources(
      this,
      `profilePoint`,
      {
        stackName: `profilePoint`,
        env: {
          region: buildConfig.AWSProfileRegion,
        },
      },
      buildConfig,
      statefulStack,
    )

    const dkUiDataResources = newDkUiDataResources(this, buildConfig)

    const apiGatewayStack = newAPIGatewayResources(
      this,
      `apiGateway`,
      {
        certificate: certManagerStack.certificate,
        hostedZone: certManagerStack.hostedZone,
        lambda: {
          getViewerCount: viewerCountResources.getViewerCountFunction,
          voteCFP: voteCFPResources.voteCFPFunction,
          postProfilePoint: profilePointResources.postProfilePointFunction,
          getProfilePoint: profilePointResources.getProfilePointFunction,
          getDkUiData: dkUiDataResources.getDkUiDataFunction,
          patchDkUiData: dkUiDataResources.patchDkUiDataFunction,
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
