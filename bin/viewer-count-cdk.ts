#!/usr/bin/env node
//import { Tags } from '@aws-cdk/core'
import { App, Tags } from 'aws-cdk-lib';
import { ViewerCountStack } from './../lib/viewer-count-stack';
import { BuildConfig } from './../lib/build-config';

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
        GetTracksURL: ensureString(unparsedEnv, 'GetTracksURL'),
        Environment: ensureString(unparsedEnv, 'Environment'),
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

}
Main();
