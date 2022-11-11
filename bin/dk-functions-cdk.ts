#!/usr/bin/env node
import { App, Tags } from 'aws-cdk-lib'
import { BuildConfig } from '../lib/build-config'
import { StatefulStack } from '../lib/statefulStack'
import { StatelessStack } from '../lib/statelessStack'

const eventAbbr = process.env.EVENTABBR
if (eventAbbr == undefined) {
  throw new Error('[EVENTABBR] is not set')
}

const app = new App({
  context: {
    EVENTABBR: eventAbbr,
  },
})

function ensureString(
  object: { [name: string]: any },
  propName: string,
): string {
  if (!object[propName] || object[propName].trim().length === 0)
    throw new Error(propName + ' does not exist or is empty')

  return object[propName]
}

function getConfig() {
  const env = app.node.tryGetContext('config')
  if (!env)
    throw new Error(
      'Context variable missing on CDK command. Pass in as `-c config=XXX`',
    )

  const unparsedEnv = app.node.tryGetContext(env)

  const buildConfig: BuildConfig = {
    DreamkastApiBaseUrl: ensureString(unparsedEnv, 'DreamkastApiBaseUrl'),
    Environment: ensureString(unparsedEnv, 'Environment'),
    DomainName: ensureString(unparsedEnv, 'DomainName'),
    HostedZoneID: ensureString(unparsedEnv, 'HostedZoneID'),
    ZoneName: ensureString(unparsedEnv, 'ZoneName'),
    AccessControlAllowOrigin: ensureString(
      unparsedEnv,
      'AccessControlAllowOrigin',
    ),
    GetTracksURL: ensureString(unparsedEnv, 'GetTracksURL'),
    AWSProfileRegion: ensureString(unparsedEnv, 'AWSProfileRegion'),
  }

  return buildConfig
}

async function Main() {
  const buildConfig: BuildConfig = getConfig()

  Tags.of(app).add('Environment', buildConfig.Environment)

  const statefulStack = new StatefulStack(
    app,
    `stateful-${buildConfig.Environment}`,
    {
      stackName: `stateful-${buildConfig.Environment}`,
      env: {
        region: buildConfig.AWSProfileRegion,
      },
    },
    buildConfig,
  )

  const statelessStack = new StatelessStack(
    app,
    `stateless-${buildConfig.Environment}`,
    {
      stackName: `stateless-${buildConfig.Environment}`,
      env: {
        region: buildConfig.AWSProfileRegion,
      },
    },
    buildConfig,
    statefulStack,
  )
}
Main()
