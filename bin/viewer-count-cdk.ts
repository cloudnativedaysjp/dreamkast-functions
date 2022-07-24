#!/usr/bin/env node
//import { Tags } from '@aws-cdk/core'
import { App, Tags } from 'aws-cdk-lib';
import { SaveViewerCountStack } from './../lib/save-viewer-count-cdk-stack';
import { GetViewerCountStack } from './../lib/get-viewer-count-cdk-stack';
import { BuildConfig } from './../lib/build-config';

const eventAbbr =  process.env.EVENTABBR
if (eventAbbr == undefined){
    throw new Error('[EVENTABBR] is not set')
}

const app = new App({
    context: {
        EVENTABBR: 'cnsec2022',
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

    const saveViewerCountStack = new SaveViewerCountStack(app, `SaveViwerCountStack-${buildConfig.Environment}`, {
        stackName: `SaveViewerCount-${buildConfig.Environment}`,
        env: {
            region: buildConfig.AWSProfileRegion,
        }
    }, buildConfig);
    
    const getViewerCountStack = new GetViewerCountStack(app, `GetViwerCountStack-${buildConfig.Environment}`, {
        stackName: `GetViewerCount-${buildConfig.Environment}`,
        env: {
            region: buildConfig.AWSProfileRegion,
        }
    });
    getViewerCountStack.addDependency(saveViewerCountStack);
}
Main();
