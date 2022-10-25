#!/usr/bin/env node
import { App, Tags } from 'aws-cdk-lib';
import { ViewerCountStack } from './../lib/viewer-count-stack';
import { VoteCFPStack } from './../lib/vote-cfp-stack';
import { ProfilePointStack } from './../lib/profile-point-stack';
import { APIGatewayStack } from './../lib/apigateway-stack';
import { BuildConfig } from './../lib/build-config';
import { CertManagerStack } from './../lib/cert-manager-stack';

const eventAbbr =  process.env.EVENTABBR
if (eventAbbr == undefined){
    throw new Error('[EVENTABBR] is not set')
}

const app = new App({
    context: {
        EVENTABBR: eventAbbr,
    }
});

function ensureString(object: { [name: string]: any }, propName: string ): string
{
    if(!object[propName] || object[propName].trim().length === 0)
        throw new Error(propName +" does not exist or is empty");

    return object[propName];
}

function getConfig()
{
    let env = app.node.tryGetContext('config');
    if (!env)
        throw new Error("Context variable missing on CDK command. Pass in as `-c config=XXX`");

    let unparsedEnv = app.node.tryGetContext(env);

    let buildConfig: BuildConfig = {
        Environment: ensureString(unparsedEnv, 'Environment'),
        DomainName: ensureString(unparsedEnv, 'DomainName'),
        HostedZoneID: ensureString(unparsedEnv, 'HostedZoneID'),
        ZoneName: ensureString(unparsedEnv, 'ZoneName'),
        AccessControlAllowOrigin: ensureString(unparsedEnv, 'AccessControlAllowOrigin'),
        GetTracksURL: ensureString(unparsedEnv, 'GetTracksURL'),
        AWSProfileRegion: ensureString(unparsedEnv, 'AWSProfileRegion'),
    };

    return buildConfig;
}

async function Main()
{
    let buildConfig: BuildConfig = getConfig();

    Tags.of(app).add('Environment', buildConfig.Environment);

    const viewerCountStack = new ViewerCountStack(app, `viewerCountStack-${buildConfig.Environment}`, {
        stackName: `viewerCount-${buildConfig.Environment}`,
        env: {
            region: buildConfig.AWSProfileRegion,
        }
    }, buildConfig);

    const voteCFPStack = new VoteCFPStack(app, `voteCFPStack-${buildConfig.Environment}`, {
        stackName: `voteCFP-${buildConfig.Environment}`,
        env: {
            region: buildConfig.AWSProfileRegion,
        }
    }, buildConfig);

    const certManager = new CertManagerStack(app, `certManagerStack-${buildConfig.Environment}`,{
        stackName: `certManager-${buildConfig.Environment}`,
        env: {
            region: buildConfig.AWSProfileRegion,
        }
    }, buildConfig);

    const profilePointStack = new ProfilePointStack(app, `profilePointStack-${buildConfig.Environment}`, {
        stackName: `profilePoint-${buildConfig.Environment}`,
        env: {
            region: buildConfig.AWSProfileRegion,
        }
    });

    const apiGatewayStack = new APIGatewayStack(app, `apigGatewayStack-${buildConfig.Environment}`, {
        certificate: certManager.certificate,
        hostedZone: certManager.hostedZone,
        lambda: {
            voteCFP: voteCFPStack.voteCFPFunction,
            postProfilePoint: profilePointStack.postProfilePointFunction,
            getProfilePoint: profilePointStack.getProfilePointFunction,
        },
        stackName: `apiGatewayStack-${buildConfig.Environment}`,
        env: {
            region: buildConfig.AWSProfileRegion,
        }
    }, buildConfig);
    //apiGatewayStack.addDependency(viewerCountStack);
    //apiGatewayStack.addDependency(voteCFPStack);

}
Main();
