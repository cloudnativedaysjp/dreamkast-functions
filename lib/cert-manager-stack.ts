import { Construct } from 'constructs'
import { StackProps, Stack } from 'aws-cdk-lib'
import {
  Certificate,
  CertificateValidation,
  DnsValidatedCertificate,
} from 'aws-cdk-lib/aws-certificatemanager'
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53'
import { BuildConfig } from './build-config'

export function newCertManagerResources(
  scope: Construct,
  id: string,
  props: StackProps,
  buildConfig: BuildConfig,
) {
  const hostedZone = HostedZone.fromHostedZoneAttributes(scope, 'CNDHostZone', {
    hostedZoneId: buildConfig.HostedZoneID,
    zoneName: buildConfig.ZoneName,
  })

  const certificate = new DnsValidatedCertificate(scope, 'Certificate', {
    domainName: buildConfig.DomainName,
    hostedZone: hostedZone,
    validation: CertificateValidation.fromDns(hostedZone),
  })

  return {
    hostedZone,
    certificate,
  }
}
