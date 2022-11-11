import { Construct } from 'constructs'
import { StackProps, Stack } from 'aws-cdk-lib'
import {
  Certificate,
  CertificateValidation,
  DnsValidatedCertificate,
} from 'aws-cdk-lib/aws-certificatemanager'
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53'
import { BuildConfig } from './buildConfig'

export class CertManagerStack extends Stack {
  public readonly certificate: Certificate
  public readonly hostedZone: IHostedZone

  constructor(
    scope: Construct,
    id: string,
    props: StackProps,
    buildConfig: BuildConfig,
  ) {
    super(scope, id, props)

    this.hostedZone = HostedZone.fromHostedZoneAttributes(this, 'CNDHostZone', {
      hostedZoneId: buildConfig.HostedZoneID,
      zoneName: buildConfig.ZoneName,
    })

    this.certificate = new DnsValidatedCertificate(this, 'Certificate', {
      domainName: buildConfig.DomainName,
      hostedZone: this.hostedZone,
      validation: CertificateValidation.fromDns(this.hostedZone),
    })
  }
}
