export interface BuildConfig {
  readonly DreamkastApiBaseUrl: string
  readonly Environment: string
  readonly DomainName: string
  readonly HostedZoneID: string
  readonly ZoneName: string
  readonly AccessControlAllowOrigin: string
  readonly GetTracksURL: string
  readonly AWSProfileRegion: string
}
